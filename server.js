const express = require('express')
const jwt = require('express-jwt')
const cors = require('cors')
const ethers = require('ethers')
const app = express()

app.use(cors())
app.use(express.static(__dirname + '/public'))

app.use(jwt({
  // NOTE: we're using signature based authentication so this secret doesn't matter.
  secret: 'somesecret',
  requestProperty: 'auth',
  credentialsRequired: false
}))

const challenge = 'siawdawdgn this aaaaaaaaaaawdstring'

app.get('/challenge', (req, res) => {
  res.json({ challenge })
})

app.get('/verify', async (req, res) => {
  console.log("(Server) I got the token that has address and signature...")
  const { address, signature } = req.auth

  console.log("(Server) This is the address: ", address)
  console.log("(Server) This is the signature: ", signature)

  const data = '0x' + Buffer.from(challenge).toString('hex')
  console.log("(Server) Verifying the data signature")
  const verified = await verifySignature(address, data, signature)

  if (verified == true) console.log("Verified!")
  else console.log("Failed!")

  res.json({ verified })
})

const port = process.env.PORT || 8000

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

async function verifySignature(_account, _data, _signature) {
  const eip1271Abi = [
    {
      constant: true,
      inputs: [
        {
          name: '_messageHash',
          type: 'bytes'
        },
        {
          name: '_signature',
          type: 'bytes'
        }
      ],
      name: 'isValidSignature',
      outputs: [
        {
          name: 'magicValue',
          type: 'bytes4'
        }
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    }
  ]

  const magicValue = '0x20c13b0b'
  const provider = ethers.getDefaultProvider('kovan')
  const instance = new ethers.Contract(_account, eip1271Abi, provider)
  const result = await instance.isValidSignature(_data, _signature)
  const verified = (result === magicValue)

  return verified
}
