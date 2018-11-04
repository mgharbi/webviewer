import argparse
import string
import os
import json
import shutil
import subprocess

def make_data(path, out):
  for r, dirs, files in os.walk(path):
    out_r = r.replace(path, out)
    if not os.path.exists(out_r):
      os.makedirs(out_r)

    for f in files:
      src = os.path.join(r, f)
      dst = os.path.join(out_r, f.replace(".exr", ".hdr"))
      print("  ", src, "->", dst)
      cmd = ["pfsin", src]
      ret = subprocess.call(cmd)
      print(ret)

def main(args):
  root = os.path.dirname(os.path.realpath(__file__))
  data_dir = os.path.join(args.output, "data")

  # Make dirs and copy static
  if not os.path.exists(args.output):
    os.makedirs(args.output)
    shutil.copytree(os.path.join(root, "static"), os.path.join(args.output, "static"))
    os.makedirs(data_dir)

  data = make_data(args.data_root, data_dir)

  with open(os.path.join(root, "template.html")) as fid:
    template = fid.read()

  with open(os.path.join(root, "static", "shaders", "hdrviewer.frag")) as fid:
    frag = fid.read()

  with open(os.path.join(root, "static", "shaders", "hdrviewer.vert")) as fid:
    vert = fid.read()

  out = string.Template(template).substitute(
    frag_shader=frag,
    vert_shader=vert,
    width=args.width,
    height=args.height)

  # with open(os.path.join(args.output, "index.html"), 'w') as fid:
  #   fid.write(out)


if __name__ == "__main__":
  parser = argparse.ArgumentParser()
  parser.add_argument("data_root")
  parser.add_argument("output")
  parser.add_argument("--width", type=int, default=1024)
  parser.add_argument("--height", type=int, default=512)
  args = parser.parse_args()
  main(args)
