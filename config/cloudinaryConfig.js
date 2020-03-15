import { config, uploader } from "cloudinary";

const cloudinaryConfig = () =>
  config({
    cloud_name: "daokgy02f",
    api_key: "458714275563999",
    api_secret: "jdbtRqdsVTYR1DB2EeTmZzQYYWQ"
  });

export { cloudinaryConfig, uploader };
