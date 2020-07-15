# user-management-sdk-js
[![codecov](https://codecov.io/bb/adastradev/user-management-sdk-js/branch/master/graph/badge.svg?token=hcWKFlEsQ1)](https://codecov.io/bb/adastradev/user-management-sdk-js)

Ad Astra user management SDK for JavaScript in the browser and Node.js

## Tools

### **AuthManager** (Class)

The AuthManager class can be used to:

<details>
<summary>Sign in a user through AWS's managed Cognito identity provider</summary>
<br>

`.signIn( email, password, newPassword = '' )` => Promise -> [CognitoUserSession](https://github.com/aws-amplify/amplify-js/blob/master/packages/amazon-cognito-identity-js/src/CognitoUserSession.js)

Used to obtain a CognitoUserSession.
</details>

<details>
<summary>Get/refresh credentials, and set environment credentials with one function</summary>
<br>

`.getAndSetEnvironmentCredentials()` => Promise -> [CognitoIdentityCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityCredentials.html)

This will set the following environment variables from the CognitoIdentityCredentials object:

```typescript
process.env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY
process.env.AWS_SESSION_TOKEN
```

This function is equivalent to:

```typescript
const creds = await authManagerInstance.refreshCognitoCredentials();
authManagerInstance.setEnvironmentIAMCreds(creds);
```

</details>

<details>
<summary>Get/refresh cognito credentials, and federated identity credentials</summary>
<br>

`.refreshCognitoCredentials()` => Promise -> [CognitoIdentityCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityCredentials.html)

Returns a promise which resolves a fresh CognitoIdentityCredentials object **after signing in**. 

</details>

<details>
<summary>Set credentials in the environment</summary>
<br>

`.setEnvironmentIAMCreds(creds: CognitoIdentityCredentials)` => void

This will set the following environment variables from the CognitoIdentityCredentials object:

```typescript
process.env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY
process.env.AWS_SESSION_TOKEN
```
</details>
