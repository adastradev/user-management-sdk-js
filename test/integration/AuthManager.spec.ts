import { AuthManager } from '../../source';
import { CognitoUserPoolLocatorUserManagement } from '../../source/CognitoUserPoolLocatorUserManagement';
import * as chai from 'chai';
import { DiscoverySdk } from '@adastradev/serverless-discovery-sdk';
import fetch from 'node-fetch';
import { config } from 'aws-sdk';
// tslint:disable-next-line: no-string-literal
global['fetch'] = fetch;

const expect = chai.expect;

describe.only('AuthManager', () => {
  let auth: AuthManager;

  before( async () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    const locator = new CognitoUserPoolLocatorUserManagement(region);
    const discovery = new DiscoverySdk(
      process.env.DISCOVERY_SERVICE || process.env.DISCOVERY_SERVICE_DEV,
      region,
      process.env.DEFAULT_STAGE || 'dev'
    );
    process.env.USER_MANAGEMENT_URI = await discovery.lookupService('user-management');
    auth = new AuthManager(locator, region);
  });

  it('Should successfully login and refresh credentials', async () => {
    await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);

    config.credentials = await auth.getIamCredentials();
    const didRefresh1 = await auth.refreshCognitoCredentials();
    expect(didRefresh1).to.equal(true);
  });

  it('Should return false if credentials did not need refresh', async () => {
    await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);

    config.credentials = await auth.getIamCredentials();
    const didRefresh1 = await auth.refreshCognitoCredentials();
    expect(didRefresh1).to.equal(true);

    const didRefresh2 = await auth.refreshCognitoCredentials();
    expect(didRefresh2).to.equal(false);
  });
});
