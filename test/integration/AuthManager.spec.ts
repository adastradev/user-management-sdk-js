import { AuthManager } from '../../source';
import { CognitoUserPoolLocatorUserManagement } from '../../source/CognitoUserPoolLocatorUserManagement';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { DiscoverySdk } from '@adastradev/serverless-discovery-sdk';
import fetch from 'node-fetch';
import { config } from 'aws-sdk';
// tslint:disable-next-line: no-string-literal
global['fetch'] = fetch;

chai.use(chaiAsPromised as any);
const expect = chai.expect;

describe.only('AuthManager', () => {
  let auth: AuthManager;
  let sandbox: sinon.SinonSandbox;

  before( async () => {
    sandbox = sinon.createSandbox();
    config.credentials = null;
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

  after(() => {
    sandbox.restore();
  });

  it('Should successfully login and refresh credentials', async () => {
    await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);

    config.credentials = await auth.getIamCredentials();
    const didRefresh1 = await auth.refreshCognitoCredentials();
    expect(didRefresh1).to.equal(true);
  });

  describe('refreshCognitoCredentials', () => {

    it('Should return false if credentials did not need refresh', async () => {
      await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);

      config.credentials = await auth.getIamCredentials();
      const didRefresh1 = await auth.refreshCognitoCredentials();
      expect(didRefresh1).to.equal(true);

      const didRefresh2 = await auth.refreshCognitoCredentials();
      expect(didRefresh2).to.equal(false);
    });

    it('Should reject if there is a cognitoUser refreshSession error', async () => {
      await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
      config.credentials = await auth.getIamCredentials();

      sandbox.stub((auth as any).cognitoUser, 'refreshSession').callsArgWith(1, Error('Blah'));

      expect(auth.refreshCognitoCredentials()).eventually.rejectedWith('Blah');
    });

    it('Should reject if there is an iamCredentials refresh error', async () => {
      await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
      config.credentials = await auth.getIamCredentials();

      sandbox.stub((auth as any).iamCredentials, 'refresh').callsArgWith(0, Error('Blah'));

      expect(auth.refreshCognitoCredentials()).eventually.rejectedWith('Blah');
    });

    it('Should reject if there is a cognitoUserSession getRefreshToken error', async () => {
      await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
      config.credentials = await auth.getIamCredentials();

      sandbox.stub((auth as any).cognitoUserSession, 'getRefreshToken').throws(Error('Blah'));

      expect(auth.refreshCognitoCredentials()).eventually.rejectedWith('Blah');
    });

  });
});
