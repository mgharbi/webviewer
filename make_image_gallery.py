import os

HEADER = \
"""<html>
  <head>
    <meta charset="utf-8">
    <title>Image viewer</title>
    <link href='https://fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
  </head>

  <body>
    <div class="container-fluid" id="content">
        <h1 class="text-center">
        DANF results
        </h1>
            <a class="btn btn-primary" href="index.html" role="button">Home</a>
          <p>
          Use (CMD) + (+), or (CTRL) + (+) to increase the zoom of your browser, as
          needed.
          </p>

"""

def _make_image(data, root):
    path = os.path.abspath(data["path"]).replace(root, "")[1:]

    model = data["model"]
    psnr = data["psnr"]
    hdr_mse = data["hdr_mse"]
    spp = data["spp"]

    if model == "input":
        caption = f"input <strong>{spp}spp</strong>"
    elif model == "ref":
        caption = model
    else:
        caption = f"{model} <strong>{spp}spp</strong></br> {psnr:.1f} dB | HDR-MSE = {hdr_mse:.6f}"

    im = """<figure class="figure mr-2 ml-2">\n"""
    im += f"<img src=\"{path}\" class=\"img\" alt=\"Responsive image\">\n"
    im += f"<figcaption class=\"figure-caption text-center\">{caption}</figcaption>\n"
    im += """</figure>\n"""
    return im


def _make_row(images, root):
    row = """<div class="row">\n"""
    for index, datarow in images.iterrows():
        row += _make_image(datarow, root)
    row += "</div>\n"
    return row

FOOTER = \
"""
    </div>
  </body>
</html>
"""

SEP = \
"""
<hr>
<h3 class="text-center">
    {} spp
</h3>
"""

def make_webpage(path, data):
    root = os.path.dirname(os.path.abspath(path))
    with open(path, "w") as fid:
        fid.write(HEADER)
        image_idxs = data["image_idx"].unique()
        spps = data["spp"].unique()
        for spp in spps:
            fid.write(SEP.format(spp))
            for idx in image_idxs:
                images = data[(data["image_idx"] == idx) & (data["spp"] == spp)]
                fid.write(_make_row(images, root))
        fid.write(FOOTER)
