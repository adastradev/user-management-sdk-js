import { CognitoUserPoolLocatorUserManagement } from '../../source';
import { AuthManager } from '../../source';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { DiscoverySdk } from '@adastradev/serverless-discovery-sdk';
import fetch from 'node-fetch';
import { CognitoIdentityCredentials, config } from 'aws-sdk';
import { CognitoUser } from 'amazon-cognito-identity-js';
// tslint:disable-next-line: no-string-literal
global['fetch'] = fetch;

chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('AuthManager', () => {
    let sandbox: sinon.SinonSandbox;
    let locator: CognitoUserPoolLocatorUserManagement;
    let region: string;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    before( async () => {
        config.credentials = null;
        region = process.env.AWS_REGION || 'us-east-1';
        locator = new CognitoUserPoolLocatorUserManagement(region);
        const discovery = new DiscoverySdk(
            process.env.DISCOVERY_SERVICE || process.env.DISCOVERY_SERVICE_DEV,
            region,
            process.env.DEFAULT_STAGE || 'dev'
        );
        process.env.USER_MANAGEMENT_URI = await discovery.lookupService('user-management');
    });

    beforeEach(() => {
        process.env.AWS_ACCESS_KEY_ID = null;
        process.env.AWS_SECRET_ACCESS_KEY = null;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Should have ability to login and refresh multiple times successfully', async () => {
        const auth = new AuthManager(locator, region);
        await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
        const creds = await auth.getAndSetEnvironmentCredentials();
        expect(process.env.AWS_ACCESS_KEY_ID).to.not.be.null;
        expect(process.env.AWS_ACCESS_KEY_ID).to.equal(creds.accessKeyId);
        expect(process.env.AWS_SECRET_ACCESS_KEY).to.not.be.null;
        expect(process.env.AWS_SECRET_ACCESS_KEY).to.equal(creds.secretAccessKey);
        expect(process.env.AWS_SESSION_TOKEN).to.not.be.null;
        expect(process.env.AWS_SESSION_TOKEN).to.equal(creds.sessionToken);
    });

    it('Should reject if there is a cognitoUser refreshSession error', async () => {
        const auth = new AuthManager(locator, region);
        await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
        const error = Error('Blah');
        sandbox.stub(CognitoUser.prototype, 'refreshSession').callsArgWith(1, error, null);
        return auth.getCognitoCredentials().should.eventually.be.rejectedWith(error);
    });

    it('Should reject if there is an iamCredentials refresh error', async () => {
        const auth = new AuthManager(locator, region);
        await auth.signIn(process.env.ASTRA_CLOUD_USERNAME, process.env.ASTRA_CLOUD_PASSWORD);
        const error = Error('Blah');
        sandbox.stub(CognitoIdentityCredentials.prototype, 'get').callsArgWith(0, error);
        return auth.getCognitoCredentials().should.eventually.be.rejectedWith(error);
    });
});
