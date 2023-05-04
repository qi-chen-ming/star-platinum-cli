import { bgGreen } from 'kolorist'
import rootPKG from '../package.json'
export default function getVersion() {
  console.log(
    bgGreen(` create-star-platinum `),
    `version is ${rootPKG.version}`
  )
  process.exit(0)
}
