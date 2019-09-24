
import * as chai from 'chai';
import * as sinon from 'sinon';
import { UserManagementApi } from '../../source';
import { ApiCredentials } from '@adastradev/serverless-discovery-sdk';

const expect = chai.expect;

describe('UserManagementApi', () => {

    let sandbox: sinon.SinonSandbox;
    let api: UserManagementApi;
    let tenant_id: string;
    let client: {
        invokeApi: sinon.SinonStub
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        client = { invokeApi: sinon.stub() };
        tenant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        api = new UserManagementApi('blah', 'blah', { type: 'None' } as ApiCredentials, client);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createUserPool', () => {
        it('Should invoke api with correct args', async () => {
            await api.createUserPool(tenant_id);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/admin/userpools');
            expect(client.invokeApi.args[0][2]).to.deep.equal('POST');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({ tenant_id });
        });
    });
});
