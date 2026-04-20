const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const rpName = "Evidence System";
const rpID = "localhost"; // बाद में domain डालना
const origin = "http://localhost:5500";

module.exports = {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  rpName,
  rpID,
  origin
};