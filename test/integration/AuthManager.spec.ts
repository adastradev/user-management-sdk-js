import { CognitoUserPoolLocatorUserManagement } from '../../source';
// tslint:disable-next-line:no-duplicate-imports
import { AuthManager } from '../../source';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { DiscoverySdk } from '@adastradev/serverless-discovery-sdk';
import nodeFetch from 'node-fetch';
import { CognitoIdentityCredentials, config } from 'aws-sdk';
import sleep from '../util/sleep';
// tslint:disable-next-line: no-string-literal
global['fetch'] = nodeFetch;

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

describe('AuthManager', () => {
  let sandbox: sinon.SinonSandbox;
  let locator: CognitoUserPoolLocatorUserManagement;
  let region: string;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  before(async () => {
    config.credentials = null;
    region = process.env.AWS_REGION || 'us-east-1';
    locator = new CognitoUserPoolLocatorUserManagement(region);
    const discovery = new DiscoverySdk(
      process.env.DISCOVERY_SERVICE || process.env.DISCOVERY_SERVICE_DEV,
      region,
      process.env.DEFAULT_STAGE || 'dev',
    );
    process.env.USER_MANAGEMENT_URI = await discovery.lookupService(
      'user-management',
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Should have ability to login and refresh multiple times successfully', async () => {
    const auth = new AuthManager(locator, region);
    (auth as any).minutesBeforeAllowRefresh = 0;
    await auth.signIn(
      process.env.ASTRA_CLOUD_USERNAME,
      process.env.ASTRA_CLOUD_PASSWORD,
    );
    await auth.getAndSetEnvironmentCredentials();
    const envCredsOne = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    await sleep(1000);

    await auth.getCognitoCredentials();
    await auth.getAndSetEnvironmentCredentials();
    const envCredsTwo = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    expect(envCredsOne).not.deep.equal(envCredsTwo);
  });

  it('Should reject if there is a cognitoUser refreshSession error', async () => {
    const auth = new AuthManager(locator, region);
    await auth.signIn(
      process.env.ASTRA_CLOUD_USERNAME,
      process.env.ASTRA_CLOUD_PASSWORD,
    );
    (auth as any).minutesBeforeAllowRefresh = 0;
    const error = Error('Blah');
    sandbox
      .stub((auth as any).cognitoUser, 'refreshSession')
      .callsArgWith(1, error);
    return auth
      .getAndSetEnvironmentCredentials()
      .should.eventually.be.rejectedWith(error);
  });

  it('Should reject if there is an iamCredentials refresh error', async () => {
    const auth = new AuthManager(locator, region);
    await auth.signIn(
      process.env.ASTRA_CLOUD_USERNAME,
      process.env.ASTRA_CLOUD_PASSWORD,
    );
    (auth as any).minutesBeforeAllowRefresh = 0;
    const error = Error('Blah');
    sandbox
      .stub(CognitoIdentityCredentials.prototype, 'get')
      .callsArgWith(0, error);
    return auth
      .getAndSetEnvironmentCredentials()
      .should.eventually.be.rejectedWith(error);
  });
});
