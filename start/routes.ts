/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const TodaysController = () => import('#controllers/todays_controller')
const GenerateController = () => import('#controllers/generate_controller')
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('/word', [TodaysController])
    router.post('/generate', [GenerateController])
  })
  .prefix('/api')

router.on('/').render('pages/home')
