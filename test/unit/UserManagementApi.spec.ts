
import * as chai from 'chai';
import * as sinon from 'sinon';
import { UserManagementApi } from '../../source';
import { ApiCredentials } from '@adastradev/serverless-discovery-sdk';

const expect = chai.expect;

describe('UserManagementApi', () => {

    let sandbox: sinon.SinonSandbox;
    let api: UserManagementApi;
    const tenant_id: string = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const id: string = 'idididid';
    const tenantName: string = 'blah';
    const userName: string = 'testusername';
    const password: string = 'testpassword';
    const firstName: string = 'blah';
    const lastName: string = 'blah';
    let client: {
        invokeApi: sinon.SinonStub
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        client = { invokeApi: sinon.stub() };
        api = new UserManagementApi('blah', 'blah', { type: 'None' } as ApiCredentials, client);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('bearer credentials', () => {
        it('Should have additionalParams', async () => {
            const testAPI = new UserManagementApi('https://www.aais.com/', 'blah', {
                type: 'BearerToken',
                idToken: 'blah'
            } as ApiCredentials)
            expect((testAPI as any).additionalParams).to.deep.equal({
                headers: { Authorization: 'Bearer blah' }
            });
        });
    });

    describe('No credentials', () => {
        it('Should not have additional params', async () => {
            const testAPI = new UserManagementApi('https://www.aais.com/', 'blah', {
                type: 'None'
            } as ApiCredentials)
            expect((testAPI as any).additionalParams).to.be.undefined;
        });
    });

    describe('IAM credentials', () => {
        it('Should not have additional params', async () => {
            const testAPI = new UserManagementApi('https://www.aais.com/', 'blah', {
                type: 'IAM',
                accessKeyId: 'blah',
                secretAccessKey: 'blah'
            } as ApiCredentials)
            expect((testAPI as any).additionalParams).to.be.undefined;
        });
    });

    describe('Other credentials', () => {
        it('Should throw', async () => {
            expect(() => {
                new UserManagementApi('https://www.aais.com/', 'blah', {
                    type: 'asdf'
                } as any)
            }).to.throw;
        });
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

    describe('deleteUserPool', () => {
        it('Should invoke api with correct args', async () => {
            await api.deleteUserPool(id);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/admin/userpools/' + id);
            expect(client.invokeApi.args[0][2]).to.deep.equal('DELETE');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });

    describe('getUserPools', () => {
        it('Should invoke api with correct args', async () => {
            await api.getUserPools();
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/userpools');
            expect(client.invokeApi.args[0][2]).to.deep.equal('GET');
            // Need to check that it has bearer token too
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });

    describe('createUser', () => {
        it('Should invoke api with correct args', async () => {
            await api.createUser(tenant_id, userName, password, firstName, lastName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/admin/users');
            expect(client.invokeApi.args[0][2]).to.deep.equal('POST');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({ tenant_id, userName, password, firstName, lastName });
        });
    });
    
    describe('registerTenant', () => {
        it('Should invoke api with correct args', async () => {
            await api.registerTenant(tenantName, userName, firstName, lastName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/tenant/register');
            expect(client.invokeApi.args[0][2]).to.deep.equal('POST');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({ tenantName, userName, firstName, lastName });
        });
    });

    describe('deleteUser', () => {
        it('Should invoke api with correct args', async () => {
            await api.deleteUser(userName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/admin/users/' + encodeURIComponent(userName));
            expect(client.invokeApi.args[0][2]).to.deep.equal('DELETE');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });

    describe('getPoolByUserName', () => {
        it('Should invoke api with correct args', async () => {
            await api.getUserPoolByUserName(userName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/users/' + encodeURIComponent(userName) + '/pool');
            expect(client.invokeApi.args[0][2]).to.deep.equal('GET');
            expect(client.invokeApi.args[0][3]).to.deep.equal({});
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });

    describe('getUserInfo', () => {
        it('Should invoke api with correct args', async () => {
            await api.getUserInfo(userName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/users/' + encodeURIComponent(userName) + '/info');
            expect(client.invokeApi.args[0][2]).to.deep.equal('GET');
            // Need to check that it has bearer token too
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });

    describe('getUsers', () => {
        it('Should invoke api with correct args', async () => {
            await api.getUsers(firstName);
            expect(client.invokeApi.calledOnce).to.be.true;
            expect(client.invokeApi.args[0][0]).to.deep.equal({});
            expect(client.invokeApi.args[0][1]).to.deep.equal('/users');
            expect(client.invokeApi.args[0][2]).to.deep.equal('GET');
            // Need to check that it has bearer token too
            expect(client.invokeApi.args[0][4]).to.deep.equal({});
        });
    });
});
