import { getDevServerHostIp } from "./getHostIp";
const devHostIp = getDevServerHostIp();

const environment = {
  // LOCAL --------------------
  // API_BASE_URL: `http://${devHostIp}:3000/transporter/`,

  // DEV --------------------
  // API_BASE_URL: "https://transporter-mobile-api.vercel.app/transporter/",

  // UAT --------------------
  // API_BASE_URL: "https://transporter-mobile-api-uat.vercel.app/transporter/",

  // PROD --------------------
  API_BASE_URL: "https://transporter-mobile-api-prod.vercel.app/transporter/",

};

export default environment;



