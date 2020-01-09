'user strict'
require('dotenv').config()
const { sequelize, User, Phone } = require('../models/index')
const UserService = require('../services/UserService')
const {
  generateToken,
  hashCompare,
  hashPassword,
} = require('../lib/authenticate')
const { timeDifference, timeZone } = require('../utils/moment')

class UserController extends UserService {
  constructor() {
    super(sequelize, User, Phone)
  }
  async store(req, res, next) {
    try {
      let { nome, email, senha, telefones } = req.body

      let user = await this.findUserByEmail({ email })

      if (user) {
        return res
          .status(401)
          .send({ message: 'E-mail já existente', status: 401 })
      }

      user = await this.transactionUserCreate({ nome, email, senha, telefones })

      const token = await generateToken(user.id)

      user.dataValues.token = token

      user.dataValues.ultimo_login = await timeZone(
        user.dataValues.ultimo_login
      )

      return res.send(user.dataValues)
    } catch (err) {
      return next(err)
    }
  }
  async authenticate(req, res, next) {
    try {
      let { email, senha } = req.body

      let user = await this.findUserByEmail({ email })

      if (!user) {
        return res
          .status(401)
          .send({ message: 'Usuário e/ou senha inválidos', status: 401 })
      }

      if (!(await hashCompare(senha, user.senha))) {
        return res
          .status(401)
          .send({ message: 'Usuário e/ou senha inválidos', status: 401 })
      }

      const token = await generateToken(user.id)

      await User.update(
        { ultimo_login: new Date() },
        { where: { id: user.id } }
      )
      delete user.dataValues.senha

      user.dataValues.ultimo_login = await timeZone(new Date())

      user.dataValues.token = token

      res.send(user)
    } catch (err) {
      next(err)
    }
  }

  async getUser(req, res, next) {
    try {
      const { user_id: id } = req.params

      const user_id = req.user_id
      if (parseInt(id) !== parseInt(user_id))
        return res.status(401).send({
          message: 'Não autorizado',
          status: 401,
        })

      const user = await this.findUserById({ id })

      if (!user)
        return res.status(404).send({ message: 'User not found', status: 404 })

      if ((await timeDifference(user)) > 30)
        return res.status(401).send({ message: 'Sessão inválida', status: 401 })

      user.dataValues.ultimo_login = await timeZone(
        user.dataValues.ultimo_login
      )

      res.send(user)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = UserController
