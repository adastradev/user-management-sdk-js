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

    public signIn(email: string, password: string, newPassword: string = ''): Promise<CognitoUserSession> {
        return new Promise(async function (resolve, reject) {
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
                            onSuccess: function (result) {
                                that.cognitoUserSession = result;
                                return resolve(result);
                            },
                            onFailure: function(err) {
                                return reject(err);
                            }
                        });
                    } else {
                        reject(Error('New password is required for the user'));
                    }
                }
            });
        }.bind(this));
    }

    public refreshCognitoCredentials() {
        return new Promise(async function (resolve, reject) {
            if (this.iamCredentials.needsRefresh()) {
                const authenticator = `cognito-idp.${this.region}.amazonaws.com/${this.poolData.UserPoolId}`;
                const that = this;
                console.log('Refreshing Cognito credentials');
                // tslint:disable-next-line:max-line-length
                this.cognitoUser.refreshSession(this.cognitoUserSession.getRefreshToken(), (refreshCognitoErr, newSession) => {
                    if (refreshCognitoErr) {
                        console.log(refreshCognitoErr);
                        reject(refreshCognitoErr);
                    } else {
                        that.cognitoUserSession = newSession;
                        // tslint:disable-next-line:no-string-literal max-line-length
                        this.iamCredentials.params['Logins'][authenticator]  = newSession.getIdToken().getJwtToken();
                        this.iamCredentials.refresh((refreshIamErr) => {
                            if (refreshIamErr) {
                                console.log(refreshIamErr);
                                reject(refreshIamErr);
                            } else {
                                console.log('Cognito token successfully updated');
                                resolve(true);
                            }
                        });
                    }
                });
            } else {
                resolve(false);
            }
        }.bind(this));
    }

    public getIamCredentials(durationSeconds?): Promise<AWS.CognitoIdentityCredentials> {
        return new Promise(async function (resolve, reject) {
            const authenticator = `cognito-idp.${this.region}.amazonaws.com/${this.poolData.UserPoolId}`;
            this.iamCredentials = new AWS.CognitoIdentityCredentials({
                DurationSeconds: durationSeconds || 3600,
                IdentityPoolId : this.poolData.IdentityPoolId,
                Logins : {
                    [authenticator] : this.cognitoUserSession.getIdToken().getJwtToken()
                }
            });
            resolve(this.iamCredentials);
        }.bind(this));
    }
}
