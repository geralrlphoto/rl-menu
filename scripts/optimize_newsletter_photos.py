"""
Otimiza fotos da pasta /public/newsletter/ para email:
- Redimensiona para max 1600px no lado maior (mantém proporção)
- Comprime JPEG com qualidade 82 (ponto óptimo qualidade/tamanho)
- Converte PNG para JPG (mais leve)
- Renomeia para nomes limpos
- Alvo: < 500KB por foto
"""
from PIL import Image
import os
from pathlib import Path

FOLDER = Path(__file__).parent.parent / "public" / "newsletter"
MAX_DIMENSION = 1600
JPEG_QUALITY = 82

def optimize(path: Path, new_name: str):
    img = Image.open(path)

    # Converter para RGB se RGBA (PNG com transparência)
    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', img.size, (26, 20, 16))  # cor fundo da newsletter
        if img.mode == 'P':
            img = img.convert('RGBA')
        bg.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Rotação por EXIF (Pillow >=6)
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Redimensionar
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    new_path = FOLDER / new_name
    img.save(new_path, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)

    original_kb = path.stat().st_size / 1024
    new_kb = new_path.stat().st_size / 1024
    print(f"  {path.name:45s} {original_kb:8.0f} KB -> {new_kb:6.0f} KB ({new_path.name})")
    return new_path

def main():
    if not FOLDER.exists():
        print(f"Pasta nao existe: {FOLDER}")
        return

    files = sorted([f for f in FOLDER.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')])

    print(f"A otimizar {len(files)} fotos em {FOLDER}...\n")

    # Primeiro otimizar para ficheiros temporarios
    temp_paths = []
    for idx, file in enumerate(files, 1):
        temp_name = f"_tmp_{idx:02d}.jpg"
        try:
            temp_paths.append((file, optimize(file, temp_name)))
        except Exception as e:
            print(f"  ERRO em {file.name}: {e}")

    # Apagar originais e renomear temporarios
    print("\nA substituir originais...")
    for original, temp in temp_paths:
        if original.exists():
            original.unlink()

    for idx, (_, temp) in enumerate(temp_paths, 1):
        final_name = f"casamento-{idx:02d}.jpg"
        temp.rename(FOLDER / final_name)

    # Estatisticas finais
    print("\nFinal:")
    total = 0
    for f in sorted(FOLDER.iterdir()):
        if f.suffix.lower() == '.jpg':
            kb = f.stat().st_size / 1024
            total += kb
            print(f"  {f.name:30s} {kb:6.0f} KB")
    print(f"\n  TOTAL: {total:.0f} KB ({total/1024:.1f} MB)")

if __name__ == "__main__":
    main()
