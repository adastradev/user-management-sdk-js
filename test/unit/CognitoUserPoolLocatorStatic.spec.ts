import * as chai from 'chai';
import sinon = require('sinon');
import { CognitoUserPoolLocatorStatic } from '../../source';
import { ICognitoUserPoolApiModel } from '../../source';

const expect = chai.expect;

describe('CognitoUserPoolLocatorStatic', () => {
  describe('getPoolForUsername', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('Should successfully construct a user pool api model', async () => {
      const locator = new CognitoUserPoolLocatorStatic(
        'userpoolid',
        'clientid',
        'idpoolid',
      );
      const pool = await locator.getPoolForUsername('blah');
      expect(pool).to.deep.equal({
        ClientId: 'clientid',
        IdentityPoolId: 'idpoolid',
        UserPoolId: 'userpoolid',
      } as ICognitoUserPoolApiModel);
    });
  });
});
