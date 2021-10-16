const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')

const userOneId = new mongoose.Types.ObjectId()

const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '56mike2!',
    tokens:[{
        token: jwt.sign({_id:userOneId }, process.env.JWT_SECRET)
    }]
}

beforeEach(async()=>{
    await User.deleteMany()
    await new User(userOne).save()
    // console.log('beforeEach')
})

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