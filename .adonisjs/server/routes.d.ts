import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'todays.show': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'todays.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'todays.show': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}