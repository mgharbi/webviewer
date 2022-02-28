# Image comparison web viewer

Contact: [Michael Gharbi](www.mgharbi.com)

Tested on Ubuntu 14 and OSX X 11.6


### Usage

You can create a static webpage from an image folder using the following command:

```shell
python make_webpage.py <image_folder>
```

For example, with the demo data provided:

```shell
python make_webpage.py demo_data
```

The resulting webpage will be generated in the `output` folder. Simply open `output/index.html` to view the comparison.

### Assumptions

The scripts expects a specific folder hierachy and file names. For instance to compare `m` methods, with each `n` images, the folder structure should be:

```shell
+ method_1
    |
    + image_1.jpg
    + image_2.jpg
    .
    .
    + image_n.jpg
+ method_2
    |
    + image_1.jpg
    + image_2.jpg
    .
    .
    + image_n.jpg
.
.
+ method_m
    |
    + image_1.jpg
    + image_2.jpg
    .
    .
    + image_n.jpg
```

### File formats supported

The conversion script can process `.jpg`, `.png` and `.exr` images.

Note that processing `exr` files requires `pfstools`, as we convert them to `.hdr` files for interactive visualization.