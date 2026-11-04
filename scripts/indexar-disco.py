"""Robô dos discos para a página /armazenamento.

Uso:
  python scripts/indexar-disco.py J        lê o disco J e envia a lista para a app
  pythonw scripts/indexar-disco.py --robo  o que a tarefa "RL Armazenamento" corre de 2 em 2 min:
      1. diz à app que discos USB estão ligados;
      2. lê os que têm o botão Atualizar carregado, e os discos novos que nunca foram lidos;
      3. envia a lista nova para a app (tabela armazenamento_discos).

Guarda todas as pastas (com nº de fotos, RAW, vídeos e tamanho total) e os
ficheiros que não são de câmara (projetos, música, zips...). Os JPG/RAW/vídeos
ficam só contados na pasta: são dezenas de milhares e o nome não diz nada.
As pastas internas do Lightroom (*.lrdata, *.lrcat-data) contam como uma só.

Precisa da variável de ambiente RL_AUTO_TOKEN (a mesma do robô das fotos).
Log em %LOCALAPPDATA%\\rl-armazenamento.log
"""
import ctypes
import json
import os
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
IGNORAR_RAIZ = {'autorun.inf', 'warranty.pdf', 'start_here_win.exe'}

APP_URL = os.environ.get('RL_APP_URL', 'https://rl-menu-lake.vercel.app').rstrip('/')
LOG = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'rl-armazenamento.log')
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


def indexar(letra):
    raiz = f'{letra}:\\'
    pastas, ficheiros = [], []

    def andar(caminho, rel):
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
            sub = andar(e.path, r)
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
    }


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
    api({'disco': d})
    log(f'{d["disco"]} ({letra}:) lido em {time.time() - t:.0f}s: {len(d["pastas"])} pastas, {len(d["ficheiros"])} ficheiros')


def discos_usb():
    """{nome do volume: letra} dos discos USB ligados, com nome e tamanho."""
    cmd = ("Get-Disk | ? BusType -eq 'USB' | Get-Partition | ? DriveLetter | Get-Volume | "
           "? { $_.Size -gt 0 -and $_.FileSystemLabel } | % { \"$($_.DriveLetter)|$($_.FileSystemLabel)\" }")
    out = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', cmd],
                         capture_output=True, text=True, encoding='utf-8', timeout=60,
                         creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)).stdout
    res = {}
    for linha in out.splitlines():
        if '|' in linha:
            letra, nome = linha.strip().split('|', 1)
            res[nome] = letra
    return res


def robo():
    # Não deixa duas corridas ao mesmo tempo (um disco grande pode levar mais de 2 min)
    if os.path.exists(TRINCO) and time.time() - os.path.getmtime(TRINCO) < 30 * 60:
        return
    open(TRINCO, 'w').close()
    try:
        ligados = discos_usb()
        r = api({'ligados': list(ligados)})
        conhecidos = set(r.get('conhecidos', []))
        for nome in r.get('pedidos', []):
            if nome in ligados:
                enviar(ligados[nome])
            else:
                log(f'{nome}: pedido de atualização, mas o disco não está ligado')
        for nome, letra in ligados.items():
            if nome not in conhecidos:
                log(f'{nome}: disco novo')
                enviar(letra)
    finally:
        try: os.remove(TRINCO)
        except OSError: pass


def main():
    try:
        if '--robo' in sys.argv:
            robo()
        else:
            enviar((sys.argv[1] if len(sys.argv) > 1 else 'J').strip(':\\').upper())
    except Exception as e:
        log(f'ERRO: {e}')
        raise


if __name__ == '__main__':
    main()
