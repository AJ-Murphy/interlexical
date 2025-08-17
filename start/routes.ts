/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const TodaysController = () => import('#controllers/todays_controller')
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('/word', [TodaysController, 'find'])
  })
  .prefix('/api')

router.get('/', [TodaysController, 'show'])
