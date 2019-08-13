# user-management-sdk-js

Ad Astra user management SDK for JavaScript in the browser and Node.js

## Tools

### **AuthManager** (Class)

The AuthManager class can be used to:

<details>
<summary>Sign in a user through AWS's managed Cognito identity provider</summary>
<br>

`.signIn( email, password, newPassword = '' )` => Promise -> CognitoUserSession

Used to obtain a CognitoUserSession.
</details>

<details>
<summary>Get federated IAM credentials to access AWS resources</summary>
<br>

`.getIamCredentials()` => Promise -> [CognitoIdentityCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityCredentials.html)

Returns a promise which resolbes a refreshable CognitoIdentityCredentials object **after signing in**. Typically, you will want to set your global AWS-SDK config object's `credentials` key equal to this at the beginning of your session as follows:

```typescript
import { config } from 'aws-sdk';

// Instantiate your AuthManager Instance

config.credentials = await authManagerInstance.getIamCredentials();
```
</details>

<details>
<summary>Refresh these credentials</summary>
<br>

`.refreshCognitoCredentials()` => Promise -> boolean

This will check if the credentials need refreshing using the credentials' `.needsRefresh()` method. If it does, it will refresh and resolve `true`. If it does not need refreshed, this will return `false`.
</details>
