"""Render the site's simple CP monogram as browser and Apple icon fallbacks."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((8, 8, 504, 504), radius=80, fill='#07110d', outline='#bca66a', width=16)
draw.line((96, 96, 416, 96), fill='#61785b', width=16)
draw.line((96, 416, 416, 416), fill='#61785b', width=16)
font = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 272)
draw.text((256, 256), 'CP', font=font, anchor='mm', fill='#e6d9ad')
canvas.resize((64, 64), Image.Resampling.LANCZOS).save(root / 'public/favicon.png')
canvas.save(root / 'public/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
canvas.resize((180, 180), Image.Resampling.LANCZOS).save(root / 'public/apple-touch-icon.png')
