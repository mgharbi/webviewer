"""Makes a webpage from a folder of images.

2020 Michaël Gharbi <mgharbi@adobe.com>.

Assumes the structure folder is:
  .method1
    .im1
    .im2
  .method3
    .im1
    .im2
"""
import argparse
import string
import os
import json
import shutil
import subprocess


def make_data(path, out):
    images = {}
    for r, dirs, files in os.walk(path):
        out_r = r.replace(path, out)
        if not os.path.exists(out_r):
            os.makedirs(out_r)

        for f in sorted(files):
            do_exr = False
            if do_exr:
                if not os.path.splitext(f)[-1] == ".exr":
                    continue

                src = os.path.join(r, f)
                dst = os.path.join(out_r, f.replace(".exr", ".hdr"))
                dst_link = dst.replace(out, "data")
                print("  ", src, "->", dst)
                cmd = ["pfsin", src]
                pipe_in = subprocess.Popen(cmd, stdout=subprocess.PIPE)
                cmd = ["pfsout", dst]
                pipe_out = subprocess.Popen(
                    cmd, stdin=pipe_in.stdout, stdout=subprocess.PIPE)
                pipe_out.communicate()
            else:
                if not os.path.splitext(f)[-1] in [".jpg", ".png"]:
                    continue
                src = os.path.join(r, f)
                dst = os.path.join(out_r, f)
                dst_link = dst.replace(out, "data")
                print("  ", src, "->", dst)
                shutil.copy(os.path.abspath(src), dst)

            method_name = os.path.basename(r)
            imname = os.path.splitext(f)[0]
            if imname not in images.keys():
                images[imname] = []
            images[imname].append((method_name, dst_link))

    jsonfile = {"images": []}
    for im in sorted(images):
        methods = images[im]
        elt = {"title": im, "elements": []}
        for m in sorted(methods):
            elt["elements"].append({"image": m[1], "title": m[0]})
        jsonfile["images"].append(elt)

    return jsonfile


def main(args):
    root = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.abspath(os.path.join(args.output, "data"))

    # Make dirs and copy static files
    if not os.path.exists(args.output):
        os.makedirs(args.output)
        shutil.copytree(os.path.join(root, "static"),
                        os.path.join(args.output, "static"))
        os.makedirs(data_dir)

    data = make_data(args.data_root, data_dir)
    with open(os.path.join(args.output, "static", "js", "data.js"), 'w') as fid:
        fid.write("var data = ")
        json.dump(data, fid)

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

    with open(os.path.join(args.output, "index.html"), 'w') as fid:
        fid.write(out)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("data_root")
    parser.add_argument("--output", default="output")
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=512)
    args = parser.parse_args()
    main(args)
