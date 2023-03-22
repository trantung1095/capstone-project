// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'nwjzzy7798'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-0zlqjaggqu314b68.us.auth0.com', // Auth0 domain
  clientId: '4DRem3OtLrSpEZeOCWGAorJbVY4DU9Vl', // Auth0 client id
  callbackUrl:
    'http://trantung-todo-webapp.s3-website-us-east-1.amazonaws.com/callback'
}
