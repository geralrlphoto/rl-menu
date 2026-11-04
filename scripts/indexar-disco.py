"""Índice de um disco para a página /armazenamento.

Uso:  python scripts/indexar-disco.py J
Grava app/armazenamento/discos/<NOME DO DISCO>.json e atualiza discos/index.ts.

Guarda todas as pastas (com nº de fotos, RAW, vídeos e tamanho total) e os
ficheiros que não são de câmara (projetos, música, zips...). Os JPG/RAW/vídeos
ficam só contados na pasta: são dezenas de milhares e o nome não diz nada.
As pastas internas do Lightroom (*.lrdata) contam como uma só.
"""
import ctypes
import json
import os
import re
import shutil
import sys
import unicodedata
from datetime import datetime

FOTO = {'.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff'}
RAW = {'.cr2', '.cr3', '.arw', '.nef', '.dng', '.raf', '.orf', '.rw2'}
VIDEO = {'.mov', '.mp4', '.mxf', '.avi', '.mts', '.m4v', '.insv', '.lrv'}
AUDIO = {'.wav', '.mp3', '.m4a', '.aac'}
IGNORAR_EXT = {'.lrprev', '.thm', '.xmp', '.db', '.ini', '.ds_store', '.lock', '.lrcat-wal', '.lrcat-shm'}
IGNORAR_PASTAS = {'$RECYCLE.BIN', 'System Volume Information', 'Seagate', 'Start_Here_Mac.app'}

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
destino = os.path.join(base, 'app', 'armazenamento', 'discos')


def nome_volume(letra):
    buf = ctypes.create_unicode_buffer(261)
    ctypes.windll.kernel32.GetVolumeInformationW(f'{letra}:\\', buf, 261, None, None, None, None, 0)
    return buf.value or f'DISCO {letra}'


def nfc(s):
    return unicodedata.normalize('NFC', s)


def tipo(ext):
    if ext in FOTO: return 'f'
    if ext in RAW: return 'r'
    if ext in VIDEO: return 'v'
    if ext in AUDIO: return 'a'
    return None


def main():
    letra = (sys.argv[1] if len(sys.argv) > 1 else 'J').strip(':\\').upper()
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
                if not rel and e.name.lower() in {'autorun.inf', 'warranty.pdf', 'start_here_win.exe'}:
                    continue
                b = e.stat(follow_symlinks=False).st_size
                ext = os.path.splitext(e.name)[1].lower()
                tot[5] += b
                t = tipo(ext)
                if t: tot['frva'.index(t)] += 1
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
                b = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(e.path) for f in fs)
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
    nome = nome_volume(letra)
    dados = {
        'disco': nome, 'letra': letra, 'tamanho': uso.total, 'livre': uso.free,
        'atualizado': datetime.now().isoformat(timespec='minutes'),
        'pastas': pastas, 'ficheiros': ficheiros,
    }
    os.makedirs(destino, exist_ok=True)
    ficheiro = re.sub(r'[^A-Za-z0-9_-]', '_', nome) + '.json'
    with open(os.path.join(destino, ficheiro), 'w', encoding='utf-8') as fh:
        json.dump(dados, fh, ensure_ascii=False, separators=(',', ':'))

    # index.ts com todos os discos já indexados
    jsons = sorted(f for f in os.listdir(destino) if f.endswith('.json'))
    linhas = ['// Gerado por scripts/indexar-disco.py: não editar à mão', "import type { Disco } from '../tipos'"]
    linhas += [f"import d{i} from './{f}'" for i, f in enumerate(jsons)]
    linhas.append(f"export const DISCOS = [{', '.join(f'd{i}' for i in range(len(jsons)))}] as Disco[]")
    with open(os.path.join(destino, 'index.ts'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(linhas) + '\n')
    print(f'{nome}: {len(pastas)} pastas, {len(ficheiros)} ficheiros listados -> {ficheiro}')


if __name__ == '__main__':
    main()
