"""Create cinematic 3D release artwork from the exact calendar screenshots.

The script never redraws or invents UI. It treats each verified LIGHT/DARK/RED
release PNG as a texture, then applies perspective, depth, lighting and a
tilt-shift depth-of-field effect to those original pixels.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


CANVAS_SIZE = (3840, 2160)

PRESETS = {
    "LIGHT": {
        "quad": ((-560, -120), (3720, 330), (3290, 2390), (-780, 1740)),
        "background": (242, 244, 246),
        "accent": (72, 185, 209),
        "background_brightness": 1.08,
        "background_blur": 76,
        "focus_y": 1240,
        "focus_slope": 0.115,
        "focus_width": 360,
        "plane_blur": 10,
        "depth": (34, 48),
        "vignette": 0.18,
    },
    "DARK": {
        "quad": ((-420, 190), (3460, -180), (4270, 1810), (120, 2320)),
        "background": (8, 15, 23),
        "accent": (63, 198, 224),
        "background_brightness": 0.30,
        "background_blur": 92,
        "focus_y": 1160,
        "focus_slope": -0.105,
        "focus_width": 390,
        "plane_blur": 9,
        "depth": (38, 56),
        "vignette": 0.46,
    },
    "RED": {
        "quad": ((-250, -90), (3730, 140), (4050, 2180), (-80, 2250)),
        "background": (18, 4, 5),
        "accent": (235, 82, 75),
        "background_brightness": 0.27,
        "background_blur": 86,
        "focus_y": 1110,
        "focus_slope": 0.035,
        "focus_width": 410,
        "plane_blur": 9,
        "depth": (32, 52),
        "vignette": 0.48,
    },
}


def perspective_coefficients(destination, source):
    """Return Pillow's output-to-input perspective coefficients."""
    matrix = []
    values = []
    for (x, y), (u, v) in zip(destination, source):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.extend([u, v])
    return tuple(np.linalg.solve(np.asarray(matrix, dtype=np.float64), np.asarray(values, dtype=np.float64)))


def warp_to_quad(image: Image.Image, quad) -> Image.Image:
    width, height = image.size
    source = ((0, 0), (width, 0), (width, height), (0, height))
    coefficients = perspective_coefficients(quad, source)
    return image.transform(
        CANVAS_SIZE,
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )


def cover(image: Image.Image, size) -> Image.Image:
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((math.ceil(image.width * scale), math.ceil(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def shifted_mask(mask: Image.Image, offset) -> Image.Image:
    shifted = Image.new("L", CANVAS_SIZE, 0)
    x, y = offset
    source_box = (max(0, -x), max(0, -y), min(mask.width, mask.width - x), min(mask.height, mask.height - y))
    if source_box[2] > source_box[0] and source_box[3] > source_box[1]:
        shifted.paste(mask.crop(source_box), (max(0, x), max(0, y)))
    return shifted


def depth_of_field(plane: Image.Image, preset) -> Image.Image:
    blurred = plane.filter(ImageFilter.GaussianBlur(preset["plane_blur"]))
    width, height = CANVAS_SIZE
    yy, xx = np.ogrid[:height, :width]
    focal_line = preset["focus_y"] + preset["focus_slope"] * (xx - width / 2)
    distance = np.abs(yy - focal_line)
    focus = np.clip(1.0 - (distance - preset["focus_width"] * 0.42) / preset["focus_width"], 0.0, 1.0)
    focus = (focus * focus * (3.0 - 2.0 * focus) * 255).astype(np.uint8)
    mask = Image.fromarray(focus, "L").filter(ImageFilter.GaussianBlur(20))
    return Image.composite(plane, blurred, mask)


def apply_lighting(plane: Image.Image, accent) -> Image.Image:
    width, height = CANVAS_SIZE
    x = np.linspace(0.26, 0.0, width, dtype=np.float32)
    y = np.linspace(1.0, 0.40, height, dtype=np.float32)[:, None]
    highlight_alpha = np.clip(x[None, :] * y * 255, 0, 255).astype(np.uint8)
    highlight_alpha = np.minimum(highlight_alpha, np.asarray(plane.getchannel("A"), dtype=np.uint8))
    highlight = Image.new("RGBA", CANVAS_SIZE, (*accent, 0))
    highlight.putalpha(Image.fromarray(highlight_alpha, "L"))
    return Image.alpha_composite(plane, highlight)


def add_vignette(image: Image.Image, strength: float) -> Image.Image:
    width, height = CANVAS_SIZE
    yy, xx = np.ogrid[:height, :width]
    dx = (xx - width / 2) / (width / 2)
    dy = (yy - height / 2) / (height / 2)
    distance = np.sqrt(dx * dx + dy * dy)
    alpha = np.clip((distance - 0.36) / 0.78, 0.0, 1.0) ** 1.55
    alpha = (alpha * strength * 255).astype(np.uint8)
    overlay = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    overlay.putalpha(Image.fromarray(alpha, "L"))
    return Image.alpha_composite(image, overlay)


def compose(source_path: Path, output_path: Path, preset) -> dict:
    with Image.open(source_path) as opened:
        if opened.format != "PNG":
            raise ValueError(f"{source_path.name} is not a PNG")
        source = opened.convert("RGBA")

    background = cover(source.convert("RGB"), CANVAS_SIZE)
    background = ImageEnhance.Brightness(background).enhance(preset["background_brightness"])
    background = background.filter(ImageFilter.GaussianBlur(preset["background_blur"]))
    wash = Image.new("RGB", CANVAS_SIZE, preset["background"])
    background = Image.blend(background, wash, 0.56).convert("RGBA")

    plane = warp_to_quad(source, preset["quad"])
    alpha = plane.getchannel("A")

    depth_offset = preset["depth"]
    depth_mask = shifted_mask(alpha, depth_offset).filter(ImageFilter.GaussianBlur(5))
    depth = Image.new("RGBA", CANVAS_SIZE, (2, 6, 10, 0))
    depth.putalpha(depth_mask.point(lambda value: int(value * 0.72)))

    shadow_mask = shifted_mask(alpha, (depth_offset[0] + 38, depth_offset[1] + 58)).filter(ImageFilter.GaussianBlur(58))
    shadow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    shadow.putalpha(shadow_mask.point(lambda value: int(value * 0.55)))

    plane = depth_of_field(plane, preset)
    plane = apply_lighting(plane, preset["accent"])

    composed = Image.alpha_composite(background, shadow)
    composed = Image.alpha_composite(composed, depth)
    composed = Image.alpha_composite(composed, plane)
    composed = add_vignette(composed, preset["vignette"])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    composed.convert("RGB").save(output_path, format="PNG", compress_level=7, optimize=True, dpi=(300, 300))

    signature = output_path.read_bytes()[:8].hex()
    with Image.open(output_path) as verification:
        verification.verify()
    if signature != "89504e470d0a1a0a":
        raise ValueError(f"{output_path.name} has an invalid PNG signature")

    return {
        "filename": output_path.name,
        "width": CANVAS_SIZE[0],
        "height": CANVAS_SIZE[1],
        "mode": "RGB",
        "pngSignature": signature,
        "bytes": output_path.stat().st_size,
        "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
        "source": source_path.name,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--version", required=True)
    arguments = parser.parse_args()
    output_dir = arguments.output_dir or arguments.input_dir

    results = []
    for theme, preset in PRESETS.items():
        source = arguments.input_dir / f"ADC_{theme}_{arguments.version}.png"
        output = output_dir / f"ADC_3D_{theme}_{arguments.version}.png"
        if not source.exists():
            raise FileNotFoundError(f"Missing release snapshot: {source}")
        results.append(compose(source, output, preset))

    print(json.dumps({"outputDir": str(output_dir.resolve()), "results": results}, indent=2))


if __name__ == "__main__":
    main()
