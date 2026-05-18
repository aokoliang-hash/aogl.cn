import cv2
from rembg import remove
from PIL import Image

def generate_final_sprite():
    cap = cv2.VideoCapture('turn_head_v2.mp4')
    frames = []
    count = 0
    
    while len(frames) < 24:
        ret, frame = cap.read()
        if not ret: break
        
        # 每隔 10 帧抽取一次
        if count % 10 == 0:
            # 自动抠图，转为 RGBA
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            output = remove(img_rgb) 
            frames.append(Image.fromarray(output))
        count += 1

    # 合成 6x4 雪碧图 (720x1280)
    w, h = 720, 1280
    sprite = Image.new('RGBA', (6 * w, 4 * h))
    for i, f in enumerate(frames):
        sprite.paste(f, ((i % 6) * w, (i // 6) * h))
    
    sprite.save("sprite.webp", "WEBP", lossless=False, quality=80)
    frames[0].save("frame_front.webp", "WEBP") # 取第一帧做封面

# generate_final_sprite()