const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {userOneId, userOne, setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)

// afterEach(()=>{
//     console.log('afterEach')
// })

test('Should signup a new user',async()=>{
    const response = await request(app).post('/users').send({
        name:'Ishani',
        email:'ishani@liveroom.xyz',
        password:'MyPass777!'
    }).expect(201)

    //Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assertions about the response
    //expect(response.body.user.name).toBe('Ishani')
    expect(response.body).toMatchObject({
        user:{
            name: 'Ishani',
            email: 'ishani@liveroom.xyz'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('MyPass777!')
})

test('Should login exsisting user', async()=>{
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //validate new token is saved
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexsisting user',async()=>{
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: '56mik'
    }).expect(400)
})

test('Should get profile for user', async()=>{
   await request(app)
    .get('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('SHould not get profile for unauthenticated user', async ()=>{
   await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete for user', async ()=>{
   await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    //validate user is removed
    const user = await User.findById(userOneId)
    expect(user).toBeNull()

})

test('Should not delete account for unauthenticated user', async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async()=>{
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar','tests/fixtures/profile-pic.jpg')
        .expect(200)
    const user = await User.findById(userOne)
    expect(user.avatar).toEqual(expect.any(Buffer))
    // expect({}).toEqual({})
})

test('Should update valid user fields', async()=>{
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name:'Jess'
        })
        .expect(200)

    const user = await User.findById(userOne)
    expect(user.name).toEqual('Jess')
    // expect(user.name).toBe('Jess')
})

test('Should not update invalid user fields', async()=>{
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location:'Boston'
        })
        .expect(400)
})