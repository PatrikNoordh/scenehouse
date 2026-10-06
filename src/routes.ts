export const routes = {

    catalog: '/',
    movie: '/movie/:id',
    cart: '/cart',
 }

 export const paths = {
    catalog: routes.catalog,
    movie: (id: number) => `/movie/${id}`,
    cart: routes.cart,
 }