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

router.get('/', [TodaysController, 'show'])
