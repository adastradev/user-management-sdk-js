import { ICognitoUserPoolLocator } from './ICognitoUserPoolLocator';
import * as AWS from 'aws-sdk/global';
import { ICognitoUserPoolApiModel } from './ICognitoUserPoolApiModel';
import { AuthenticationDetails, CognitoUser, CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import proxy = require('proxy-agent');
import { GlobalConfigInstance } from 'aws-sdk/lib/config';

export function configureAwsProxy(awsConfig: GlobalConfigInstance) {
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
        // TODO: does AWS support multiple proxy protocols simultaneously (HTTP and HTTPS proxy)
        // For now, this prefers HTTPS over HTTP proxy protocol for HTTPS requests
        let proxyUri = process.env.HTTP_PROXY;
        if (proxyUri === undefined) {
            proxyUri = process.env.HTTPS_PROXY;
        }
        awsConfig.update({
            httpOptions: { agent: proxy(proxyUri) }
        });
    }
}

export class AuthManager {
    private locator: ICognitoUserPoolLocator;
    private poolData: ICognitoUserPoolApiModel;
    private region: string;
    private cognitoUser: CognitoUser;
    private cognitoUserSession: CognitoUserSession;
    private iamCredentials: AWS.CognitoIdentityCredentials;

    constructor(
        locator: ICognitoUserPoolLocator,
        region: string
    ) {
        this.locator = locator;
        this.region = region;
        // AWS module configuration
        configureAwsProxy(AWS.config);
        AWS.config.region = region;
    }

    public signIn = (email: string, password: string, newPassword: string = ''): Promise<CognitoUserSession> => {
        return new Promise(async (resolve, reject) => {
            // get the pool data from the response
            console.log(`Signing into AWS Cognito`);
            try {
                this.poolData = await this.locator.getPoolForUsername(email);
            } catch (error) {
                return reject(error);
            }

            // construct a user pool object
            const userPool = new CognitoUserPool(this.poolData);
            // configure the authentication credentials
            const authenticationData = {
                Password: password,
                Username: email
            };
            // create object with user/pool combined
            const userData = {
                Pool: userPool,
                Username: email
            };
            // init Cognito auth details with auth data
            const authenticationDetails = new AuthenticationDetails(authenticationData);
            // authenticate user to in Cognito user pool
            this.cognitoUser = new CognitoUser(userData);

            const that = this;
            this.cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess(result) {
                    that.cognitoUserSession = result;
                    return resolve(result);
                },
                onFailure(err) {
                    return reject(err);
                },
                mfaRequired(codeDeliveryDetails) { // eslint-disable-line
                    return reject(Error('Multi-factor auth is not currently supported'));
                },
                newPasswordRequired(userAttributes, requiredAttributes) { // eslint-disable-line
                    if (newPassword !== undefined && newPassword.length > 0) {
                        // User was signed up by an admin and must provide new
                        // password and required attributes

                        // These attributes are not mutable and should be removed from map.
                        delete userAttributes.email_verified;
                        delete userAttributes['custom:tenant_id'];
                        that.cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
                            onFailure: (err) => {
                                return reject(err);
                            },
                            onSuccess: (result) => {
                                that.cognitoUserSession = result;
                                return resolve(result);
                            }
                        });
                    } else {
                        reject(Error('New password is required for the user'));
                    }
                }
            });
        });
    }

    public refreshCognitoCredentials = async () => {

        // Check if credentials need refresh
        if (this.iamCredentials.needsRefresh()) {
            console.log('Refreshing Cognito credentials');
            const authenticator = `cognito-idp.${this.region}.amazonaws.com/${this.poolData.UserPoolId}`;

            // If so, refresh Cognito user session
            this.cognitoUser.refreshSession(
                this.cognitoUserSession.getRefreshToken(),
                // User session refresh callback
                (err, newSession) => {
                    if (err) {
                        throw err;
                    } else {
                        this.cognitoUserSession = newSession;
                        // tslint:disable-next-line: no-string-literal
                        this.iamCredentials.params['Logins'][authenticator] = newSession.getIdToken().getJwtToken();
                    }
                }
            );

            // Refresh identity credentials using new Cognito session and
            // return true indicating that credentials were refreshed
            await this.iamCredentials.refreshPromise();
            return true;
        } else {
            return false;
        }
    }

    public getIamCredentials = async (durationSeconds: number = 3600): Promise<AWS.CognitoIdentityCredentials> => {

        const authenticator = `cognito-idp.${this.region}.amazonaws.com/${this.poolData.UserPoolId}`;

        // Assemble refreshable credentials object
        this.iamCredentials = new AWS.CognitoIdentityCredentials({
            DurationSeconds: durationSeconds,
            IdentityPoolId : this.poolData.IdentityPoolId,
            Logins : {
                [authenticator] : this.cognitoUserSession.getIdToken().getJwtToken()
            }
        });

        return this.iamCredentials;
    }

    public needsRefresh = () => {
        return this.iamCredentials.needsRefresh();
    }
}
