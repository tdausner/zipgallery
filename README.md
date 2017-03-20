# ZIP image gallery

Setting up an image gallery on a web site managed by a web content management system (CMS) gives you the opportunity to click a lot around that CMS:

- upload each image
- link each image to the gallery
- issue tags or captions to each image
- order the images (on demand)

Why this? Life is too short to repeat all these boring jobs for each image!

Adobe Lightroom (LR) is the tool of my choice for image processing. I do enter all keywords and titles and captions on processing the images there. Possibly there might be a solution for some CMS to grab this information from the IPCT tags of the images. But not for all CMS.

## Image workflow oriented solution

Facing the task list mentioned above I decided to develop an image workflow oriented solution:

- process images in Lightroom issuing all image information
- export images from Lightroom as jpg files including all meta information
- zip all demanded images in order of appearance
- upload image ZIP file
- set up a we page with a link to the ZIP file
- The last three steps replace the initial task list. Three steps instead of N times repeated four steps.

In the past I have set up image galleries on web servers utilising  the fancybox library. This is also part of the ZIP Gallery solution (see License.txt file).

## Image workflow

The image workflow sketched above consists of four steps. The first three steps are not covered in deep in this document as you should be familiar with the tools involved.

### Process images

Use your favourite image processing or image organisational software to issue all demanded image information like copyright, title and/or caption. Next export images as jpg files including all meta information.

### Zip images

The tool of your favour to create ZIP archives you should be familiar with, too. Put all image files into a plain ZIP archive file in the order you want the images to appear in the ZIP  Gallery on the web server.

### Upload image ZIP file

Use the environment dependent file manager (CMS, file transfer, ...)  to upload the the recently created image ZIP archive.

### Set up a web page

When you have uploaded the ZIP archive containing the images for the image gallery there are just a few steps more until the web image gallery is up and running. This depends on your application (see application list on the right).
