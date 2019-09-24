
import * as chai from 'chai';
import * as sinon from 'sinon';
import { CognitoUserPoolLocatorUserManagement } from '../../source/CognitoUserPoolLocatorUserManagement';
import { ICognitoUserPoolApiModel } from '../../source';

const expect = chai.expect;

describe('CognitoUserPoolLocatorUserManagement', () => {

    describe('getPoolForUsername', () => {
        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should successfully construct a user pool api model', async () => {
            const locator = new CognitoUserPoolLocatorUserManagement('us-east-1');
            
            sandbox.stub(CognitoUserPoolLocatorUserManagement.prototype, 'getPoolForUsername').resolves({
                ClientId: 'clientid',
                IdentityPoolId: 'idpoolid',
                UserPoolId: 'userpoolid'
            });

            const pool = await locator.getPoolForUsername('blah');

            expect(pool).to.deep.equal({
                ClientId: 'clientid',
                IdentityPoolId: 'idpoolid',
                UserPoolId: 'userpoolid'
            } as ICognitoUserPoolApiModel);
        });
    });
});
