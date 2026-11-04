"""Robô dos discos para a página /armazenamento.

Uso:
  python scripts/indexar-disco.py J K      lê os discos J e K, envia a lista e recalcula os backups
  python scripts/indexar-disco.py --backups  só recalcula os backups com a memória dos discos
  pythonw scripts/indexar-disco.py --robo  o que a tarefa "RL Armazenamento" corre de 2 em 2 min:
      1. pergunta à app se houve clique no botão Atualizar (e diz que discos estão ligados);
      2. só lê os discos com clique; sem clique não toca em nenhum disco;
      3. envia a lista nova para a app (tabela armazenamento_discos).
      Um disco novo só fica registado (card "Ainda não lido"), sem ser lido.

Guarda todas as pastas (com nº de fotos, RAW, vídeos e tamanho total) e os
ficheiros que não são de câmara (projetos, música, zips...). Os JPG/RAW/vídeos
ficam só contados na pasta: são dezenas de milhares e o nome não diz nada.
As pastas internas do Lightroom (*.lrdata, *.lrcat-data) contam como uma só.

Precisa da variável de ambiente RL_AUTO_TOKEN (a mesma do robô das fotos).
Log em rui claude code\\rl-armazenamento.log
"""
import ctypes
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from datetime import datetime
from urllib import request as urlrequest

FOTO = {'.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff'}
RAW = {'.cr2', '.cr3', '.arw', '.nef', '.dng', '.raf', '.orf', '.rw2'}
VIDEO = {'.mov', '.mp4', '.mxf', '.avi', '.mts', '.m4v', '.insv', '.lrv'}
AUDIO = {'.wav', '.mp3', '.m4a', '.aac'}
IGNORAR_EXT = {'.lrprev', '.thm', '.xmp', '.db', '.ini', '.ds_store', '.lock', '.lrcat-wal', '.lrcat-shm'}
IGNORAR_PASTAS = {'$RECYCLE.BIN', 'System Volume Information', 'Seagate', 'Start_Here_Mac.app'}
IGNORAR_RAIZ = {'autorun.inf', 'warranty.pdf', 'start_here_win.exe',
                'install western digital software for mac.dmg', 'install western digital software for windows.exe'}

APP_URL = os.environ.get('RL_APP_URL', 'https://rl-menu-lake.vercel.app').rstrip('/')
# Log na pasta "rui claude code" (fora do repositório; o AppData não é visto igual por todas as apps)
TRABALHO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG = os.path.join(TRABALHO, 'rl-armazenamento.log')
# Memória de cada disco (ficheiros de cada casamento), para comparar discos que não estão ligados ao mesmo tempo
MEMORIA = os.path.join(TRABALHO, 'armazenamento-memoria')

# Pasta de um evento: "CAS ...", "CAS_...", "Casamento ...", "Batizado ...", "BTZ...", "Pre wedding ...", "Same day edit ..."
# (não apanha as pastas que só agrupam, como "CASAMENTOS" ou "Casamentos_2025")
EVENTO = re.compile(r'^(cas[ _]|casamento |batizado |btz|bat[ _]|pr[eé][ -]?wedding|same day edit)', re.I)
COM_BACKUP, SEM_BACKUP = 95, 5  # % do conteúdo que existe noutro disco
TRINCO = os.path.join(os.environ.get('TEMP', os.path.expanduser('~')), 'rl-armazenamento.lock')


def log(msg):
    linha = f'{datetime.now():%Y-%m-%d %H:%M:%S}  {msg}'
    try:
        if sys.stdout:
            print(linha)
    except Exception:
        pass
    try:
        # guarda só as últimas ~300 linhas
        antigas = open(LOG, encoding='utf-8').read().splitlines()[-300:] if os.path.exists(LOG) else []
        with open(LOG, 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(antigas + [linha]) + '\n')
    except OSError:
        pass


def nfc(s):
    return unicodedata.normalize('NFC', s)


def nome_volume(letra):
    buf = ctypes.create_unicode_buffer(261)
    ctypes.windll.kernel32.GetVolumeInformationW(f'{letra}:\\', buf, 261, None, None, None, None, 0)
    return buf.value


def tipo(ext):
    if ext in FOTO: return 0
    if ext in RAW: return 1
    if ext in VIDEO: return 2
    if ext in AUDIO: return 3
    return None


MIN_REPETIDO = 100_000  # ficheiros com menos de 100 KB não contam para os repetidos


def repetidos(registo, por_pasta):
    """Ficheiros com o mesmo nome e o mesmo tamanho em mais de uma pasta do disco.
    registo: {(nome em minúsculas, bytes): [(pasta, nome)]}; por_pasta: {pasta: nº de ficheiros}."""
    grupos = [(b, locs) for (_, b), locs in registo.items() if len(locs) > 1]
    pares = {}
    for b, locs in grupos:
        sitios = sorted({p for p, _ in locs})
        for i in range(len(sitios)):
            for j in range(i + 1, len(sitios)):
                x = pares.setdefault((sitios[i], sitios[j]), [0, 0])
                x[0] += 1
                x[1] += b
    pastas = sorted(({'a': a, 'b': c, 'n': n, 'bytes': bb, 'ta': por_pasta.get(a, 0), 'tb': por_pasta.get(c, 0)}
                     for (a, c), (n, bb) in pares.items()), key=lambda x: -x['bytes'])[:200]
    fich = sorted(({'n': locs[0][1], 'b': b, 'p': sorted({p for p, _ in locs})} for b, locs in grupos),
                  key=lambda x: -x['b'] * (len(x['p']) - 1))[:300]
    return {
        'n': sum(len(locs) - 1 for _, locs in grupos),          # cópias a mais
        'bytes': sum(b * (len(locs) - 1) for b, locs in grupos),  # espaço que as cópias a mais ocupam
        'grupos': len(grupos),
        'pastas': pastas,
        'ficheiros': fich,
    }


def indexar(letra):
    raiz = f'{letra}:\\'
    pastas, ficheiros = [], []
    registo, por_pasta = {}, {}
    eventos = {}  # pasta do evento -> [[chave, bytes]] (ficheiros ≥ 100 KB)

    def andar(caminho, rel, evento=None):
        """Devolve [fotos, raw, videos, audio, outros, bytes] da pasta toda."""
        tot = [0, 0, 0, 0, 0, 0]
        filhos = []
        try:
            entradas = list(os.scandir(caminho))
        except OSError:
            return tot
        for e in entradas:
            try:
                if e.is_dir(follow_symlinks=False):
                    if not rel and e.name in IGNORAR_PASTAS:
                        continue
                    filhos.append(e)
                    continue
                if not e.is_file(follow_symlinks=False) or e.name.startswith('.'):
                    continue
                if not rel and e.name.lower() in IGNORAR_RAIZ:
                    continue
                b = e.stat(follow_symlinks=False).st_size
                ext = os.path.splitext(e.name)[1].lower()
                tot[5] += b
                if b >= MIN_REPETIDO and ext not in IGNORAR_EXT:
                    nome = nfc(e.name)
                    registo.setdefault((nome.lower(), b), []).append((rel, nome))
                    por_pasta[rel] = por_pasta.get(rel, 0) + 1
                    if evento:
                        eventos[evento].append([f'{nome.lower()}|{b}', b])
                t = tipo(ext)
                if t is not None:
                    tot[t] += 1
                elif ext not in IGNORAR_EXT:
                    tot[4] += 1
                    ficheiros.append({'p': nfc((rel + '/' if rel else '') + e.name), 'b': b})
            except OSError:
                pass
        i = len(pastas)
        if rel:
            pastas.append(None)  # lugar guardado: o pai aparece antes dos filhos
        for e in filhos:
            r = nfc((rel + '/' if rel else '') + e.name)
            if e.name.lower().endswith(('.lrdata', '.lrcat-data')):
                b = 0
                for d, _, fs in os.walk(e.path):
                    for f in fs:
                        try: b += os.path.getsize(os.path.join(d, f))
                        except OSError: pass
                tot[5] += b
                pastas.append({'p': r, 'n': [0, 0, 0, 0, 0], 'b': b, 'lr': 1})
                continue
            ev = evento
            if not ev and EVENTO.match(e.name.strip()):
                ev = r
                eventos[ev] = []
            sub = andar(e.path, r, ev)
            for k in range(6): tot[k] += sub[k]
        if rel:
            pastas[i] = {'p': rel, 'n': tot[:5], 'b': tot[5]}
        return tot

    andar(raiz, '')
    uso = shutil.disk_usage(raiz)
    return {
        'disco': nome_volume(letra) or f'DISCO {letra}', 'letra': letra,
        'tamanho': uso.total, 'livre': uso.free,
        'pastas': pastas, 'ficheiros': ficheiros,
        'repetidos': repetidos(registo, por_pasta),
        # só para a memória no PC (não vai para a app)
        '_memoria': {'chaves': sorted({f'{n}|{b}' for (n, b) in registo}), 'eventos': eventos},
    }


def guardar_memoria(disco, memoria):
    os.makedirs(MEMORIA, exist_ok=True)
    nome = re.sub(r'[^A-Za-z0-9_-]', '_', disco) + '.json'
    memoria = dict(memoria, disco=disco, lido=datetime.now().isoformat(timespec='minutes'))
    with open(os.path.join(MEMORIA, nome), 'w', encoding='utf-8') as fh:
        json.dump(memoria, fh, ensure_ascii=False, separators=(',', ':'))


def calcular_backups(ocultos):
    """Para cada casamento de cada disco: que parte do conteúdo (em bytes) existe noutro disco.
    Usa a memória de todos os discos lidos neste PC; discos escondidos não contam como backup."""
    if not os.path.isdir(MEMORIA):
        return {}
    discos = {}
    for f in os.listdir(MEMORIA):
        if f.endswith('.json'):
            with open(os.path.join(MEMORIA, f), encoding='utf-8') as fh:
                m = json.load(fh)
            if m['disco'] not in ocultos:
                discos[m['disco']] = m
    chaves = {n: set(m['chaves']) for n, m in discos.items()}
    res = {}
    for nome, m in discos.items():
        outros = [(o, chaves[o]) for o in discos if o != nome]
        lista = []
        for pasta, fich in m['eventos'].items():
            total = sum(b for _, b in fich)
            if total < 1_000_000_000:  # menos de 1 GB: pastas vazias ou só com música/projetos
                continue
            achado, por_disco = 0, {}
            for k, b in fich:
                onde = [o for o, s in outros if k in s]
                if onde:
                    achado += b
                    for o in onde:
                        por_disco[o] = por_disco.get(o, 0) + b
            pct = round(achado * 100 / total)
            lista.append({
                'p': pasta, 'b': total, 'pct': pct,
                'estado': 'com' if pct >= COM_BACKUP else 'sem' if pct < SEM_BACKUP else 'parcial',
                'onde': sorted(({'d': o, 'pct': round(v * 100 / total)} for o, v in por_disco.items()), key=lambda x: -x['pct'])[:3],
            })
        res[nome] = sorted(lista, key=lambda x: (x['pct'], -x['b']))
    return res


def atualizar_backups():
    r = api({'ligados': list(volumes_com_nome())})
    b = calcular_backups(set(r.get('ocultos', [])))
    if b:
        api({'backups': b})
        sem = sum(1 for l in b.values() for x in l if x['estado'] == 'sem')
        log(f'Backups recalculados: {sem} eventos sem backup em {len(b)} discos')


def api(corpo):
    token = os.environ.get('RL_AUTO_TOKEN', '')
    if not token:
        raise RuntimeError('falta a variável de ambiente RL_AUTO_TOKEN')
    req = urlrequest.Request(f'{APP_URL}/api/armazenamento-robo', method='POST',
                             data=json.dumps(corpo, ensure_ascii=False).encode('utf-8'),
                             headers={'x-auto-token': token, 'content-type': 'application/json'})
    with urlrequest.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))


def enviar(letra):
    t = time.time()
    d = indexar(letra)
    guardar_memoria(d['disco'], d.pop('_memoria'))
    api({'disco': d})
    log(f'{d["disco"]} ({letra}:) lido em {time.time() - t:.0f}s: {len(d["pastas"])} pastas, {len(d["ficheiros"])} ficheiros')


def discos_usb():
    """{nome do volume: letra} dos discos USB ligados, com nome e tamanho."""
    # saída em UTF-8: nomes com acentos (ex.: "VD EDIÇÃO") partiam a leitura
    cmd = ("[Console]::OutputEncoding = [Text.Encoding]::UTF8; Get-Disk | ? BusType -eq 'USB' | Get-Partition | ? DriveLetter | Get-Volume | "
           "? { $_.Size -gt 0 -and $_.FileSystemLabel } | % { \"$($_.DriveLetter)|$($_.FileSystemLabel)\" }")
    out = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', cmd],
                         capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=120,
                         stdin=subprocess.DEVNULL,  # com pythonw não há consola: sem isto o PowerShell fica à espera
                         creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)).stdout
    res = {}
    for linha in (out or '').splitlines():
        if '|' in linha:
            letra, nome = linha.strip().split('|', 1)
            res[nome] = letra
    return res


def volumes_com_nome():
    """{nome do volume: letra} de todos os discos com nome (USB ou internos, como os NAS)."""
    k32 = ctypes.windll.kernel32
    k32.SetErrorMode(1)  # leitores de cartões vazios: sem janela de erro do Windows
    res = {}
    mascara = k32.GetLogicalDrives()
    for i in range(26):
        letra = chr(65 + i)
        if not mascara & (1 << i) or letra == 'C':
            continue
        if k32.GetDriveTypeW(f'{letra}:\\') not in (2, 3):  # removível ou fixo
            continue
        nome = nome_volume(letra)
        if nome:
            res[nome] = letra
    return res


def robo():
    # Não deixa duas corridas ao mesmo tempo (um disco grande pode levar mais de 2 min)
    if os.path.exists(TRINCO) and time.time() - os.path.getmtime(TRINCO) < 30 * 60:
        return
    open(TRINCO, 'w').close()
    try:
        # Discos já conhecidos são reconhecidos pelo nome, ligados por USB ou internos (NAS, NAS 2)
        ligados = volumes_com_nome()
        r = api({'ligados': list(ligados)})
        conhecidos = set(r.get('conhecidos', []))
        lidos = 0
        for nome in r.get('pedidos', []):
            if nome in ligados:
                enviar(ligados[nome])
                lidos += 1
            else:
                log(f'{nome}: pedido de atualização, mas o disco não está ligado')
        if lidos:
            atualizar_backups()  # um disco novo pode mudar os backups dos outros
        # Disco novo (só USB, para não trazer os discos do sistema): fica "Ainda não lido",
        # é lido quando carregares em Atualizar
        for nome, letra in discos_usb().items():
            if nome not in conhecidos:
                uso = shutil.disk_usage(f'{letra}:\\')
                api({'novo': {'disco': nome, 'letra': letra, 'tamanho': uso.total, 'livre': uso.free}})
                log(f'{nome} ({letra}:): disco novo, à espera do botão Atualizar')
    finally:
        try: os.remove(TRINCO)
        except OSError: pass


def main():
    try:
        if '--robo' in sys.argv:
            robo()
        elif '--backups' in sys.argv:
            atualizar_backups()
        else:
            for letra in (sys.argv[1:] or ['J']):
                enviar(letra.strip(':\\').upper())
            atualizar_backups()
    except Exception as e:
        log(f'ERRO: {e}')
        raise


if __name__ == '__main__':
    main()
