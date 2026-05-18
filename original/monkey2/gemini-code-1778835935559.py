import shutil
import subprocess
import sys

# 抽 24 帧并拼成 6 列的雪碧图，同时在帧上标注序号以便你观察
# 这里的 scale 可以调小一点方便预览，比如 360:640
# Windows 需指定 fontfile，否则 drawtext / fontconfig 可能崩溃或无输出；-update 1 用于单帧 jpg。
FFMPEG = shutil.which("ffmpeg")
if not FFMPEG:
    print("未找到 ffmpeg，请先安装并把 bin 加到 PATH。", file=sys.stderr)
    sys.exit(1)

vf = (
    r"select='not(mod(n,10))',scale=360:640,tile=6x4,"
    r"drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{frame_num}':"
    r"x=10:y=10:fontsize=24:fontcolor=red"
)

cmd = [
    FFMPEG,
    "-hide_banner",
    "-y",
    "-i",
    "turn_head_v2.mp4",
    "-vf",
    vf,
    "-frames:v",
    "1",
    "-update",
    "1",
    "calibration_sheet.jpg",
]

r = subprocess.run(cmd)
raise SystemExit(r.returncode)
