import cv2
from rembg import remove
from PIL import Image
import numpy as np

VIDEO_PATH = 'turn_head_v2.mp4'
OUTPUT_SPRITE = 'sprite_hd_120.webp'
COLS, ROWS = 10, 12  # 120帧布局
# 锁定固定画布，防止身体大小不一
TARGET_W, TARGET_H = 720, 1280 

def generate_stable_sprite():
    cap = cv2.VideoCapture(VIDEO_PATH)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    indices = [int(i * (total_frames - 1) / 119) for i in range(120)]
    
    final_frames = []
    print("正在进行稳定性处理...")

    for i, idx in enumerate(indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret: break

        # 1. BGR转RGB
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 2. 移除背景
        # 注意：这里我们只通过rembg获取透明度，不裁剪尺寸
        no_bg_raw = remove(img_rgb)
        
        # 3. 强制转换回 720x1280 的固定画布，严禁缩放
        # 这步确保了无论猴子轮廓怎么变，它在720x1280里的相对位置不变
        pil_img = Image.fromarray(no_bg_raw).convert("RGBA")
        
        # 4. 如果你想让猴子更清晰，可以整体缩放，但必须每一帧【比例完全一致】
        # 这里直接使用原始比例，不做任何自动裁切
        final_frames.append(pil_img)
        print(f"进度: {i+1}/120")

    cap.release()

    # 拼接雪碧图
    sprite_sheet = Image.new('RGBA', (TARGET_W * COLS, TARGET_H * ROWS), (0, 0, 0, 0))
    for index, img in enumerate(final_frames):
        x = (index % COLS) * TARGET_W
        y = (index // COLS) * TARGET_H
        sprite_sheet.paste(img, (x, y))

    sprite_sheet.save(OUTPUT_SPRITE, 'WEBP', quality=80, method=6)
    print("稳定性修正版雪碧图已完成！")

if __name__ == "__main__":
    generate_stable_sprite()