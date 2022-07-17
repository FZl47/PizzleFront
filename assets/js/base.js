// Init
const URL_BACKEND = 'http://127.0.0.1:8000/v1'
const PAGE_LOGIN = 'login.html'
const PAGE_HOME = 'index.html'
const PAGE_SIGNUP = 'signup.html'
const PAGE_RESETPASSWORD = 'reset-password.html'
const PAGE_ERROR_500 = '500.html'
const PAGE_ERROR_404 = '404.html'
const PAGE_MEAL_DETAIL = 'food.html'
const PAGE_MEALS = 'foods.html'

const SYMBOL_CURRENCY = '$'


class PIZZLE {

    constructor(get_user = false) {
        let This = this
        this._details_func = {}
        this.COUNTER_TRY_GET_TOKENS = 3
        this.COUNTER_TRY_ADD_TO_CART = 1
        this.USER = null
        if (get_user) {
            setTimeout(function() { This.GET_USER() }, 20)
        }

    }

    GET_USER = function() {
        let url = this.URL('user/get-user')
        let details = this.SEND_AJAX(url, {}, false, true, false, false)
        let status = details.status
        if (status == 200) {
            this.USER = details.data.user
        }
    }

    // SET_DETAILS = function(status, message, data = {}) {
    //     this._details_func = {
    //         'status': status,
    //         'message': message,
    //         'data': data
    //     }
    //     return this._details_func
    // }

    // GET_DETAILS = function() {
    //     return this._details_func
    // }

    URL = function(url, slash = false, arg = null) {
        if (slash) {
            slash = '/'
        } else {
            slash = ''
        }
        if (!arg) {
            return `${URL_BACKEND}/${url}${slash}`
        } else {
            return `${URL_BACKEND}/${url}${slash}?${arg[0]}=${arg[1]}`
        }
    }


    URL_TEMPLATE = function(name_template, arg = null) {
        if (!arg) {
            return `${name_template}`
        } else {
            return `${name_template}?${arg[0]}=${arg[1]}`
        }
    }

    UPDATE_TOKEN_USER = function(refresh) {
        let url = this.URL('user/token/get-access-token')
        let details = this.SEND_AJAX(url, {
            'refresh': refresh
        }, false)
        if (details.status == 200) {
            this._SET_ACCESS_TOKEN(details.data.access)
            return true
        } else {
            return false
        }
    }

    _GET_REFRESH_TOKEN = function() {
        return GetCookieByName('refresh-user')
    }

    _GET_ACCESS_TOKEN = function() {
        return GetCookieByName('access-user')
    }

    _SET_REFRESH_TOKEN = function(refresh_token, remember_me) {
        let expire_day = remember_me == true ? 30 : 'Session'
        SetCookie('refresh-user', refresh_token, expire_day)
    }

    _SET_ACCESS_TOKEN = function(access_token) {
        let date = new Date();
        date.setTime(date.getTime() + (20 * 60 * 1000));
        let expire_minute = date
        SetCookie('access-user', access_token, expire_minute)
    }

    GET_USER_TOKEN = function(go_to_login = true) {

        let refresh = this._GET_REFRESH_TOKEN()
        let access = this._GET_ACCESS_TOKEN()

        function view_login() {
            if (go_to_login) {
                window.location.href = PAGE_LOGIN
            } else {
                return null
            }
        }

        if (refresh) {
            return {
                'refresh': refresh,
                'access': access
            }
        } else {
            view_login()
        }
    }

    VIEW_ERROR_500 = function() {
        window.location.href = PAGE_ERROR_500
    }

    VIEW_ERROR_404 = function() {
        window.location.href = PAGE_ERROR_404
    }


    SEND_AJAX = function(url, data, error_message = true, auth = false, error_redirect = true, login_redirect = false, success, failed, method = 'POST') {
        let This = this
        let details = {}

        function SET_DETAILS(status, message, data) {
            details = {
                'status': status,
                'message': message,
                'data': data
            }
        }



        SendAjax(url, data, method,
            function(response) {
                // Success
                SET_DETAILS(response.status_code, response.message, response.data)
                if (success) {
                    success(response)
                }
            },
            function(response) {
                // Failed
                let status = response.status
                response = response.responseJSON

                if (status != 200 && error_redirect) {
                    if (status == 500) {
                        This.VIEW_ERROR_500()
                    }
                    if (status == 404) {
                        This.VIEW_ERROR_404()
                    }
                }

                if (status == 401 && auth && This._GET_REFRESH_TOKEN()) {
                    This.COUNTER_TRY_GET_TOKENS -= 1
                    if (This.COUNTER_TRY_GET_TOKENS > 0) {
                        let state_update_token = This.UPDATE_TOKEN_USER(This._GET_REFRESH_TOKEN())
                        if (state_update_token) {
                            This.COUNTER_TRY_GET_TOKENS = 3
                        } else {
                            // This.VIEW_ERROR_500()
                        }
                    }
                }

                if (status == 0) {
                    ShowNotificationMessage('Please Check your connection', 'Error')
                }
                SET_DETAILS(parseInt(status), response.error, response.data)

                if (failed) {
                    failed(response)
                }
                if (error_message) {
                    let error_text = response.error
                    ShowNotificationMessage(error_text, 'Error')
                }
            }, false, auth, login_redirect
        )

        return details
    }


    NOTIFY_ME = function(slug) {
        let url = this.URL('food/notify-me')
        let details = this.SEND_AJAX(url, {
            'slug': slug
        }, false, true, true, true)
        return details
    }


    GET_ALL_MEALS = function(data = {}) {
        let url = this.URL('food/get-meals')
        let details = this.SEND_AJAX(url, data, true)
        return details
    }

    GET_MEALS_BY_CATEGORY = function(data = {}) {
        let url = this.URL('food/get-meals-by-category')
        let details = this.SEND_AJAX(url, data, false, false, true, false)
        return details
    }

    GET_ONLY_FOODS = function() {

    }

    GET_ONLY_DRINKS = function() {

    }

    GET_MEALS_WITH_DISCOUNT() {
        let url = this.URL('food/get-meals-discounts')
        let details = this.SEND_AJAX(url)
        return details.data
    }

    GET_MEALS_POPULAR(data = {}) {
        let url = this.URL('food/get-meals-popular')
        let details = this.SEND_AJAX(url, data)
        return details.data
    }

    ADD_TO_CART_BTN(slug, btn) {
        this.ADD_TO_CART(slug)
    }

    ADD_TO_CART(slug, count = 1) {
        let url = this.URL('user/cart/add')
        let data = {
            'slug': slug,
            'count': count
        }
        let details = this.SEND_AJAX(url, data, false, true, false, true)
        let status = details.status
        if (status == 401) {
            if (this.COUNTER_TRY_ADD_TO_CART > 0) {
                this.COUNTER_TRY_ADD_TO_CART -= 1
                this.ADD_TO_CART(slug, count)
            }
        }
        if (status == 200) {
            this.COUNTER_TRY_ADD_TO_CART = 1
            ShowNotificationMessage(details.message, 'Success', 4000, 1)
        }
        if (status != 200 && status != 401) {
            ShowNotificationMessage(details.message, 'Error', 5000, 2)
        }
    }

    GET_HTML_ELEMENT_MEAL(meal) {
        let This = this

        let discount = meal.discount

        let element_discount = ''
        if (discount) {
            element_discount = `
                <div class="pizza_discount">
                    <p class="pizza_discount_percentage">${meal.discount_percentage}%</p>
                </div>
            `
        }

        let rate_percentage = parseInt(meal.rate) * 20
        let element_rate = `
                <div class="ratings-container">
                    <div class="ratings">
                        <div class="ratings-val" style="width: ${rate_percentage}%;"></div>
                    </div>
                </div>
        `


        let element_info = ''
        if (meal.type == 'group') {
            element_info =
                `
                <div class="pizza_slide_info">
                    <div>
                        <i class="fas fa-wine-bottle"></i>
                        <p>${meal.count_drink}</p>
                    </div>
                    <div>
                        <i class="fas fa-pizza-slice"></i>
                        <p>${meal.count_food}</p>
                    </div>
                </div>
            
            `
        }

        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
        let slug_add_to_cart = meal.slug

        let node = `
            <div class="pizza_item">
                <div class="pizza_slide_header">
                    ${element_discount}${element_rate}
                </div>
                <div class="pizza_slide_img">
                    <img src="${meal.cover_image}" alt="${meal.title}" />
                    <div class="pizza_slide_action">
                        <button onclick="PIZZLE_OBJECT.ADD_TO_CART_BTN('${slug_add_to_cart}',this)" btn-add-to-cart="${slug_add_to_cart}" ><i class="fas fa-shopping-cart"></i> Add to cart</button>
                    </div>
                </div>
                ${element_info}
                <div class="pizza_slide_text">
                    <h3><a href="${slug}">${meal.title_short}</a></h3>
                    <p>${meal.description_short}</p>
                    <h3 class="pizza_slide_price"><span class="currencySymbol">${SYMBOL_CURRENCY}</span>${meal.price}</h3>
                </div>
            </div> 
        `
        return node
    }

    GET_HTML_ELEMENT_MEAL_POPULAR = function(meal) {
        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
        let rate_percentage = parseInt(meal.rate) * 20
        let node = `
            <li>
                <div class="recent-img">
                    <a href="${slug}">
                        <img src="${meal.cover_image}" alt="${meal.title}" title="${meal.title}">
                    </a>
                </div>
                <div class="recent-text">
                    <h4>
                        <a href="${slug}">${meal.title_short}</a>
                    </h4>
                    <p>${SYMBOL_CURRENCY}${meal.price}</p>
                    <div class="ratings-container d-block">
                        <div class="ratings">
                            <div class="ratings-val" style="width: ${rate_percentage}%;"></div>
                        </div>
                    </div>
                </div>
            </li>
        `
        return node
    }

    CREATE_ELEMENT_MEAL(meal, container) {
        let node = this.GET_HTML_ELEMENT_MEAL(meal)
        container.innerHTML += node
    }

    CREATE_ELEMENT_MEAL_POPULAR(meal, container) {
        let node = this.GET_HTML_ELEMENT_MEAL_POPULAR(meal)
        container.innerHTML += node
    }

}


class Home extends PIZZLE {
    constructor() {
        super()
        this.COUNTER_TRY_GET_INFO = 3

        this.container_meals_discount = document.getElementById('container-meals-discount')
        this.container_meals_popular = document.getElementById('container-meals-popular')

        this.get_info()
        let meals_discount = this.GET_MEALS_WITH_DISCOUNT()
        for (let meal of meals_discount) {
            this.CREATE_ELEMENT_MEAL(meal, this.container_meals_discount)
        }

        let meals_popular = this.GET_MEALS_POPULAR()
        for (let meal of meals_popular) {
            this.CREATE_ELEMENT_MEAL(meal, this.container_meals_popular)
        }


    }

    get_info = function() {
        let url = this.URL('public/')
        let details = this.SEND_AJAX(url, {}, false)
        if (details.status == 401) {
            if (this.COUNTER_TRY_GET_INFO > 0) {
                this.COUNTER_TRY_GET_INFO -= 1
                this.get_info()
            }
        }
        if (details.status == 200) {
            this.COUNTER_TRY_GET_INFO = 3
        }
    }
}


class Login extends PIZZLE {
    constructor() {
        super()
    }

    login = function(username, password) {
        let url = this.URL('user/login')
        let details = this.SEND_AJAX(url, {
            'email': username,
            'password': password
        }, false, false, false, false)
        return details
    }

}

class SignUp extends PIZZLE {
    constructor() {
        super()
    }

    register = function(username, password, password2) {
        let url = this.URL('user/register')
        let details = this.SEND_AJAX(url, {
            'email': username,
            'password': password,
            'password2': password2,
        }, false, false, false, false)
        return details
    }
}

class ResetPassword extends PIZZLE {
    constructor() {
        super()
    }

    send_code = function(email) {
        let url = this.URL('user/reset-password/get-code')
        let details = this.SEND_AJAX(url, {
            'email': email
        }, false, false, false, false)
        this.EMAIL = email
        return details
    }

    check_code = function(code) {
        let url = this.URL('user/reset-password/validate-code')
        let details = this.SEND_AJAX(url, {
            'email': this.EMAIL,
            'code': code
        }, false, false, false, false)
        this.CODE = code
        return details
    }

    set_password = function(password, password2) {
        let url = this.URL('user/reset-password/set-password')
        let details = this.SEND_AJAX(url, {
            'email': this.EMAIL,
            'code': this.CODE,
            'password': password,
            'password2': password2
        }, false, false, false, false)
        return details
    }
}

class Food extends PIZZLE {
    constructor() {
        super(true)
        this.url_params = new URLSearchParams(window.location.search)
        this.container_related = document.getElementById('container-related-foods')
        this.MEAL = null
        let data = this.get_info()
        this.set_info(data)
        this.related_meals()
    }

    related_meals = function() {
        let data = {
            'category_slug': this.MEAL.category.slug,
            'slug': this.MEAL.slug
        }
        let details = this.GET_MEALS_BY_CATEGORY(data)
        if (details.status == 200) {
            let meals = details.data.meals
            for (let meal of meals) {
                this.CREATE_ELEMENT_MEAL(meal, this.container_related)
            }
        }
    }



    get_info = function() {
        let slug = this.url_params.get('slug')
        if (!slug) {
            this.VIEW_ERROR_404()
        }
        let url = this.URL('food/get-meal')
        let details = this.SEND_AJAX(url, {
            'slug': slug
        }, false, true)
        let status = details.status
        if (status == 404) {
            this.VIEW_ERROR_404()
        }
        return details.data
    }

    set_info(data) {
        let This = this
        this.MEAL = data
        let is_available = data.is_available


        // Elements
        let title_el = document.getElementById('title')
        let category_el = document.getElementById('category')
        let rating_val_el = document.getElementById('rating-val')
        let comments_count = document.getElementById('count-comments')
        let price_el = document.getElementById('price')
        let description_el = document.getElementById('description')
        let quantity_el = document.getElementById('quantity')
        let container_quantity_el = document.getElementById('container-quantity')
        let btn_add_to_cart_el = document.getElementById('btn-add-to-cart')
        let btn_let_me_know = document.getElementById('btn-let-me-know')
        let container_images = document.getElementById('container-images')

        // Data 
        title_el.innerText = data.title
        category_el.innerText = data.category.title
        category_el.href = this.URL_TEMPLATE(PAGE_MEALS, ['category', data.category.slug])
        rating_val_el.style.width = (parseInt(data.rate) * 20) + '%'
        description_el.innerText = data.description
        quantity_el.max = data.stock



        // Event
        if (is_available) {
            btn_add_to_cart_el.addEventListener('click', function() {
                This.ADD_TO_CART(This.MEAL.slug, $('#quantity').val())
            })
            btn_add_to_cart_el.classList.remove('d-none')
        } else {
            btn_let_me_know.classList.remove('d-none')
        }

        // Data Node
        let price_discount_node = ``
        if (is_available) {
            if (data.discount) {
                // Price & Discount
                price_discount_node = `
                    <del><span class="Price-currencySymbol">${SYMBOL_CURRENCY}</span>${data.price_base}</del>
                    <ins><span class="Price-currencySymbol">${SYMBOL_CURRENCY}</span>${data.price}</ins>
                    <div class="discount-info">
              
                        <p>${data.discount_title}</p>
                        <div>
                            <span>${data.discount_percentage}%</span>
                            <div class="d-inline-block" TimerCounterDown ToDateTimer="${data.discount_timeend}">
                                <span data-content="Second"></span> :
                                <span data-content="Minute"></span> :
                                <span data-content="Hour"></span> :
                                <span data-content="Day"></span>
                            </div>
                        </div>
                      
                    </div>
                `
            } else {
                // Price & Discount
                price_discount_node = `
                    <ins><span class="Price-currencySymbol">${SYMBOL_CURRENCY}</span>${data.price}</ins>
                `
            }
            price_el.innerHTML = price_discount_node
            RunAllCounterTimers()


        } else {
            price_el.innerHTML = `
                <p class="meal-is-unavailable">
                    The meal is unavailable
                </p>
            `
            container_quantity_el.classList.add('d-none')


            // Notify Me
            let node_notifyme = ``

            function toggleContentNotify(btn, is_active) {
                if (is_active) {
                    node_notifyme = `<i class="fas fa-check"></i> Will Notified`
                    btn.setAttribute('notify-me', 'active')
                } else {
                    node_notifyme = ` <i class="fas fa-bell"></i> Notify me when available`
                    btn.setAttribute('notify-me', 'disabled')
                }
                btn.innerHTML = node_notifyme
            }
            toggleContentNotify(btn_let_me_know, data.notify_is_active)

            btn_let_me_know.addEventListener('click', function() {
                let details = This.NOTIFY_ME(This.MEAL.slug)
                let status = details.status
                if (status == 200) {
                    let is_active = details.data.notify_is_active
                    toggleContentNotify(btn_let_me_know, is_active)
                }
            })

        }

        // Images
        for (let image of data.images) {
            let node = `
                <div class="product-details-image">
                    <img src="${image.url}" alt="${data.title}" />
                </div>
            `
            container_images.innerHTML += node
        }



        RunOwlCarousel()


        function RunOwlCarousel() {
            $("#container-images").owlCarousel({
                autoplay: true,
                loop: true,
                margin: 30,
                touchDrag: true,
                mouseDrag: true,
                nav: false,
                dots: false,
                autoplayTimeout: 6000,
                autoplaySpeed: 1200,
                responsive: {
                    0: {
                        items: 1
                    },
                    480: {
                        items: 1
                    },
                    600: {
                        items: 1
                    },
                    1000: {
                        items: 1
                    },
                    1200: {
                        items: 1
                    }
                }
            });

            var selector = $('#container-images');

            $('.next_image').click(function() {
                selector.trigger('next.owl.carousel');
            });

            $('.prev_image').click(function() {
                selector.trigger('prev.owl.carousel');
            });
        }


    }

}




class Foods extends PIZZLE {
    constructor() {
        super()
        this.url_params = new URLSearchParams(window.location.search)
        this.container_meals = document.getElementById('container-meals')
        this.container_categories = document.getElementById('container-categories')
        this.container_meals_popular = document.getElementById('container-meals-popular')
        this.sort_by = document.getElementById('sort-by')
        this.input_search = document.getElementById('input-search')
        this.count_results = document.getElementById('count-results')
        this.set_event_input_sortby()
        this.get_categories()
        this.get_and_create_meals()
        this.get_meals_popular()
        this.active_element_param_search()
    }

    active_element_param_search = function() {

        // active category searched
        let category_search = this.url_params.get('category')
        if (category_search && category_search != 'all') {
            try {
                document.querySelector(`[slug="${category_search}"]`).classList.add('category-active')
            } catch (e) {}
        } else {
            document.getElementById('category-all').classList.add('category-active')
        }

        // active sort-by 
        let sort_by_search = this.url_params.get('sort-by')
        let options = this.sort_by.querySelectorAll('option')
        for (let option of options) {
            option.removeAttribute('selected')
        }
        try {
            this.sort_by.querySelector(`[value="${sort_by_search}"]`).setAttribute('selected', 'selected')
        } catch (e) {}

    }

    set_event_input_sortby = function() {
        let This = this
        this.sort_by.addEventListener('change', function(e) {
            let category = This.url_params.get('category') || 'all'
            let new_url = new URLSearchParams(window.location.search);
            new_url.set('sort-by', This.sort_by.value)
            window.location.search = new_url
        })
    }

    pagination_meals = function(pagination) {
        let page_active = document.getElementById('page-active')
        let all_pages = document.getElementById('all-pages')
        let container_pagination = document.getElementById('container-pagination')
        let pages_num = parseInt(pagination.pages)
        let page_active_num = parseInt(pagination.page_active)
        all_pages.innerText = pages_num
        page_active.innerText = page_active_num


        function create_node_page() {

            let node_results = ''

            function create(page_num) {
                let active_page = page_active_num == page_num ? "class='active'" : ''
                return `
                <li ${active_page}>
                    <button onclick="FOODS_OBJECT.go_to_page(${page_num})">
                        ${page_num}
                    </button>
                </li>
                `
            }

            if (pagination.has_previous) {
                if (page_active_num - 2 > 1) {
                    node_results += create(pagination.page_previous - 1)
                }
                node_results += create(pagination.page_previous)
            }

            node_results += create(page_active_num)


            if (pagination.has_next) {

                node_results += create(pagination.page_next)
                if (page_active_num + 2 < pagination.last_page) {
                    node_results += create(pagination.page_next + 1)
                }
            }


            return node_results
        }

        let node_pages = create_node_page()


        let base_node = `
            <li>
                <button onclick="FOODS_OBJECT.go_to_page(${pagination.first_page})">
                    <i class="fa fa-angle-double-left"></i>
                </button>
            </li>
            <li>...</li>
                ${node_pages}
            <li>...</li>
            <li>
            <button onclick="FOODS_OBJECT.go_to_page(${pagination.last_page})">
                    <i class="fa fa-angle-double-right"></i>
                </button>
            </li>
        `
        container_pagination.innerHTML += base_node


    }

    show_not_found_meal(container) {
        let node = `
            <div class="meals-not-found">
                <div class="text-right">
                    <img src="assets/img/icon04.png">
                </div>
                <div>
                    <p class="text-center">not found foods</p>
                </div>
                <div class="text-left">
                    <img src="assets/img/icon01.png">
                </div>
            </div>
        `
        container.innerHTML += node
    }

    go_to_page = function(page_num) {
        let url_search = new URLSearchParams(window.location.search)
        url_search.set('page', page_num)
        window.location.search = url_search
    }


    get_and_create_meals = function() {
        let category = this.url_params.get('category')
        let sort_by = this.url_params.get('sort-by')
        let page = this.url_params.get('page')
        let search = this.url_params.get('search')
        let details
        if (search) {
            this.get_meals_by_search(search)
        } else {
            if (category) {
                details = this.GET_ALL_MEALS({
                    'category_slug': category,
                    'sort_by': sort_by,
                    'page': page
                })
            } else {
                details = this.GET_ALL_MEALS({
                    'sort_by': sort_by,
                    'page': page
                })
            }
            let meals = details.data.meals
            for (let meal of meals) {
                this.CREATE_ELEMENT_MEAL(meal)
            }
            this.pagination_meals(details.data.pagination)
            this.count_results.innerHTML = meals.length
            if (meals.length < 1) {
                this.show_not_found_meal(this.container_meals)
            }
        }

    }

    get_meals_popular = function() {
        let meals = this.GET_MEALS_POPULAR({
            'count_show': 6
        })
        for (let meal of meals) {
            this.CREATE_ELEMENT_MEAL_POPULAR(meal, this.container_meals_popular)
        }
    }


    get_meals_by_search = function(search_value) {
        this.input_search.value = search_value
        let page = this.url_params.get('page')
        let sort_by = this.url_params.get('sort-by')
        let url = this.URL('food/get-meals-by-search')
        let details = this.SEND_AJAX(url, {
            'search_value': search_value,
            'sort_by': sort_by,
            'page': page
        })
        let meals = details.data.meals
        for (let meal of meals) {
            this.CREATE_ELEMENT_MEAL(meal)
        }
        this.pagination_meals(details.data.pagination)
        this.count_results.innerHTML = meals.length
        if (meals.length < 1) {
            this.show_not_found_meal(this.container_meals)
        }

    }

    CREATE_ELEMENT_MEAL = function(meal) {
        let container = document.createElement('div')
        container.className = 'col-lg-4 col-sm-6'
        let node = this.GET_HTML_ELEMENT_MEAL(meal)
        container.innerHTML = node
        this.container_meals.appendChild(container)
    }


    set_value_search_in_url = function() {
        let value_search = this.input_search.value
        window.location.href = this.URL_TEMPLATE(PAGE_MEALS, ['search', value_search])
    }



    get_categories = function() {
        let url = this.URL('food/get-categories')
        let details = this.SEND_AJAX(url)
        let categories = details.data
        for (let category of categories) {
            let slug = this.URL_TEMPLATE(PAGE_MEALS, ['category', category.slug])
            let node = `
                <li slug="${category.slug}"><a href="${slug}">${category.title}</a></li>
            `
            this.container_categories.innerHTML += node
        }

    }



}





















function ScrollOnElement(ID_Element, Element = null) {
    if (ID_Element == null) {
        try {
            window.scrollTo(0, Element.scrollTop)
        } catch (e) {}
    }
    try {
        let Element = document.getElementById(ID_Element)
        window.scrollTo(0, Element.scrollTop) || Element.scrollIntoView()
    } catch (e) {
        // Element.scrollIntoView()
        window.scrollTo(0, Element.scrollTop)
    }
}

function GoToTopPage() {
    window.scrollTo(0, 0)
}

function GoToUrl(Url, Target = 'Self') {

    if (Target == 'Self') {
        window.location.href = Url
    } else if (Target == 'Blank') {
        window.open(Url, '_blank')
    }
}

function GoToProduct(Slug) {
    window.open(`/Product/${Slug}`, '_blank');
}


function CloseContainerProducts(ID_Container) {
    document.getElementById(ID_Container).classList.add('d-none')
    ClearEffectOnBody()
}

function ClearEffectOnBody() {
    document.body.removeAttribute('class')
}



function ShowNotificationMessage(Text, Type, Timer = 5000, LevelOfNecessity = 2) {
    RemoveAllNotifications()

    let ContainerMessage = document.createElement('div')
    let Message = document.createElement('p')
    let BtnClose = document.createElement('i')

    ContainerMessage.classList.add('NotificationMessage')
    ContainerMessage.classList.add(`LevelOfNecessity_${LevelOfNecessity}`)
    ContainerMessage.classList.add(`Notification${Type}`)
    Message.innerText = Text
    BtnClose.className = 'fa fa-times BtnCloseNotification'


    ContainerMessage.appendChild(BtnClose)
    ContainerMessage.appendChild(Message)
    document.body.appendChild(ContainerMessage)
    setTimeout(function() {
        ContainerMessage.remove()
    }, Timer)

    BtnClose.onclick = function() {
        ContainerMessage.remove()
    }
}

function RemoveAllNotifications() {
    try {
        document.getElementsByClassName('NotificationMessage')[0].remove()
        document.getElementsByClassName('NotificationMessage')[1].remove()
    } catch (e) {}
}

function ValidListInputs(Inputs) {
    let State = true
    for (let Input of Inputs) {
        let Valid = Input.getAttribute('Valid')
        if (Valid == false || Valid == null || Valid == undefined) {
            State = false
        }
    }
    return State
}

function IsBlank(Value) {
    return (!Value || /^\s*$/.test(Value));
}


function CheckInputValidations(Input, Bigger, Less, SetIn = 'Input', Type = 'Text', NoSpace = false) {
    let State
    let Value = Input.value
    let ValueLength = Value.length
    if (Type == 'Email') {
        Value = ValidationEmail(Value)
    }
    if (Type == 'Number') {
        Value = ValidationIsNumber(Value)
    }
    if (Value != '' && Value != ' ' && Value != null && Value != undefined && IsBlank(Value) != true && Value != false) {
        if (ValueLength < Less && ValueLength > Bigger) {
            State = true
        } else {
            State = false
        }
    } else {
        State = false
    }

    if (Bigger < 0 && Type == 'Text') {
        State = true
    }


    if (SetIn != 'None') {
        if (SetIn == 'Container') {
            Input = Input.parentNode
            if (State == true) {
                Input.classList.add('InputValid')
            } else {
                Input.classList.remove('InputValid')
            }
        }
        if (SetIn == 'Icon') {
            let Icon = Input.parentNode.querySelector('i')
            if (State == true) {
                Icon.classList.remove('fa-times-circle')
                Icon.classList.add('fa-check-circle')
            } else {
                Icon.classList.add('fa-times-circle')
                Icon.classList.remove('fa-check-circle')
            }
        }
        if (SetIn == 'Input') {
            if (State == true) {
                Input.classList.add('InputValid')
            } else {
                Input.classList.remove('InputValid')
            }
        }
    }

    if (NoSpace == true && Type == 'Text') {
        Input.value = Value.replace(/\s+/g, '')
    }

    Input.setAttribute('Valid', State)
    return State
}


//////////////////////////////////                  Scroll          ///////////////////////////////////////////////

let HeightWindowBaseTemplate = window.innerHeight
window.onscroll = function() {
    try {
        if (window.scrollY > HeightWindowBaseTemplate) {
            document.getElementById('ButtonGoToTopPage').classList.add('ButtonGoToTopIsShow')
        } else {
            document.getElementById('ButtonGoToTopPage').classList.remove('ButtonGoToTopIsShow')
        }
    } catch (e) {}
}

//////////////////////////////////                Functionality Cookie         ///////////////////////////////////////////////
function SetCookieFunctionality_ShowNotification(Text, Type, Timer = 5000, LevelOfNecessity = 2) {
    document.cookie = `Functionality_N=${ConvertCharPersianToEnglishDecode(Text)}~${Type}~${Timer}~${LevelOfNecessity};path=/`
}



function GetCookieFunctionality_ShowNotification() {
    setTimeout(function() {
        let AllCookies = document.cookie.split(';')
        let Cookie_Key
        let Cookie_Val
        for (let Co of AllCookies) {
            let Key = Co.split('=')[0]
            let Value = Co.split('=')[1]
            if (Key == 'Functionality_N' || Key == ' Functionality_N' || Key == ' Functionality_N ') {
                Cookie_Key = Key
                Cookie_Val = Value
            }
        }
        let Text
        let Type
        let Timer
        let LevelOfNecessity
        try {
            Text = Cookie_Val.split('~')[0] || 'نا مشخص'
            Text = Text.replace('"', '')
            Text = Text.replace("'", '')
            Type = Cookie_Val.split('~')[1] || 'Warning'
            Timer = Cookie_Val.split('~')[2] || 8000
            LevelOfNecessity = Cookie_Val.split('~')[3] || 2
        } catch (e) {}
        if (Cookie_Key == 'Functionality_N' || Cookie_Key == ' Functionality_N' || Cookie_Key == ' Functionality_N ') {
            let TextResult = ConvertCharEnglishToPersianDecode(Text)
            ShowNotificationMessage(TextResult, Type, Timer, LevelOfNecessity)
        }
        document.cookie = `${Cookie_Key}=Closed; expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    })
}

/////////////  Convert English Char & Persian Decode //////////////////////////

function ConvertCharEnglishToPersianDecode(Text) {
    let Dict_Char_Persian_English = {
        'ا': 'a1',
        'آ': 'a2',
        'ب': 'b1',
        'پ': 'p1',
        'ت': 't1',
        'ث': 'c1',
        'ج': 'j1',
        'چ': 'ch',
        'ح': 'h1',
        'خ': 'kh',
        'د': 'd1',
        'ذ': 'z1',
        'ر': 'r1',
        'ز': 'z2',
        'ژ': 'zh',
        'س': 'c2',
        'ش': 'sh',
        'ص': 'c3',
        'ض': 'z3',
        'ط': 't2',
        'ظ': 'z4',
        'ع': 'a3',
        'غ': 'g_',
        'ف': 'f1',
        'ق': 'g5',
        'ک': 'k1',
        'گ': 'k2',
        'ل': 'l1',
        'م': 'm1',
        'ن': 'n1',
        'و': 'v1',
        'ه': 'h2',
        'ی': 'e2',
        ' ': '11',
        '': '22',
    }
    let CharEn = Object.keys(Dict_Char_Persian_English)
    let TextResult = ''
    for (let Index = 0; Index < Text.length; Index++) {
        if (Index % 2 == 0) {
            TextResult += GetKeyByValue(Dict_Char_Persian_English, Text[Index] + Text[Index + 1])
        }
    }
    return TextResult
}


function ConvertCharPersianToEnglishDecode(Text) {
    let Res = ''
    for (let i of Text) {
        try {
            Res += Dict_Char_Persian_English[i]
        } catch (e) {}
    }
    return Res
}


////////////////////////////////////// Remove In  List //////////////////////////////////////////////////

function RemoveInList(List, Index) {
    let Counter = 0
    Index = parseInt(Index)
    let NewList = []
    for (let i of List) {
        if (Counter != Index) {
            NewList.push(i)
        }
        Counter++
    }
    return NewList
}

//////////////////////////////////   List Is None ///////////////////////////////////////////////////////////

function ListIsNone(List) {
    let State = false
    if (List[0] == undefined) {
        State = true
    }
    return State
}

////////////////////////////////////   Value in  List  ///////////////////////////////////////////////////

function ValueInList(List, Value) {
    let State = false
    List.filter(function(e) {
        if (e == Value) {
            State = true
        }
    })
    return State
}

////////////////////////////////////  Replace With Index  ///////////////////////////////////////////////
String.prototype.ReplaceWithIndex = function(StartIndex, EndIndex, NewStr) {
    return this.substring(0, StartIndex) + NewStr + this.substring(EndIndex);
};


/////////// Get Value in Attribute ToHref in Element in Redirect To Value Geted  ///////////////////////

function GoToUrlElement(This) {
    let Href = This.getAttribute('ToHref')
    GoToUrl(Href, 'Blank')
}

/////////////////////////////    Loading Notification  /////////////////////////////////////////////////
function RemoveLoading() {
    let ElementLoading = document.getElementsByClassName('LoadingNotification')[0]
    ElementLoading.remove()
    document.body.classList.remove('DisabledAllElementsExceptLoadingNotification')
}

//////////////////////////////////        Cookie          ////////////////////////////////////////

function GetCookieByName(Name) {
    let Res = null
    let Cookie = document.cookie
    for (let i of Cookie.split(';')) {
        let S1 = i.split('=')[0]
        let S2 = i.split('=')[1]
        if (S1 == Name || S1 == ` ${Name}` | S1 == `${Name} `) {
            Res = S2
        }
    }
    return Res
}

function SetCookie(Name, Value, ExpireDay = 30, Path = '/') {
    let T = new Date()
    T.setTime(T.getTime() + (ExpireDay * 24 * 60 * 60 * 1000))
    T = T.toUTCString()
    if (ExpireDay == 'Session') {
        T = ''
    }
    document.cookie = `${Name}=${Value};expires=${T};path=${Path}`
}

////////////////////////////  Split Number   /////////////////////////////////////////////////////////

function SplitPrice(Element = null) {
    let SplitPriceNumber
    if (Element == null) {
        SplitPriceNumber = document.getElementsByClassName('SplitNumber')
    } else {
        SplitPriceNumber = new Array(Element)
    }
    for (let P of SplitPriceNumber) {
        let ListChar = []
        let Price = String(P.getAttribute('Number'))
        let Result = Price
        let LengthNumber = Price.length

        if (LengthNumber > 3) {
            Result = ''
            for (let o of Price) {
                ListChar.push(o)
            }
            ListChar.reverse()
            let CounterList = 0
            for (let i of ListChar) {
                CounterList++
                if (CounterList % 4 == 0) {
                    ListChar.splice(CounterList - 1, 0, ' , ')
                }
            }
        }
        for (let C of ListChar.reverse()) {
            Result += C
        }
        P.innerText = Result
    }
}

//////////////////////////////      Title  Element       //////////////////////////////////////////////
let AllTitle_ = document.querySelectorAll('[Title_]')
for (let Element of AllTitle_) {
    let TextTitle = Element.getAttribute('Title_')

    function CreateTitleContainer() {
        let P = document.createElement('p')
        P.className = 'Title_Style_Customize'
        P.innerHTML = TextTitle
        Element.insertBefore(P, Element.firstChild)
    }

    CreateTitleContainer()
}

////////////////////////////////      Create Container Blur   /////////////////////////////////////////////
function CreateContainerBlur(Top = 'Default', Class = null, Style = null) {
    DeleteContainerBlur()
    let Container = document.createElement('div')
    let Container2 = document.createElement('div')
        //  let IconClose = document.createElement('i')
        // IconClose.onclick = DeleteContainerBlur
        // IconClose.setAttribute('id','ContainerBlurIconClose')
        // IconClose.className = 'fa fa-times ContainerBlurIconClose'
    Container.className = 'ContainerBlur'
    Container2.className = 'ContainerContentBlur'
    Class != null ? Container.classList.add(Class) : ''
    Style != null ? Container.style = Style : ''
    Top != 'Default' ? Container.style.top = Top + '%' : ''
        //   Container2.appendChild(IconClose)
    Container.appendChild(Container2)
    document.body.insertBefore(Container, document.body.firstElementChild)
    document.body.classList.add('BlurAllElementsExceptContainerBlur')
    return Container2
}

function DeleteContainerBlur() {
    let AllContainer = document.querySelectorAll('.ContainerBlur')
    for (let i of AllContainer) {
        i.remove()
    }
    document.body.classList.remove('BlurAllElementsExceptContainerBlur')
}


////////////////     Click Out Side Container Blur And Other Container With Blur    /////////////////

function ClickOutSideContainer(Container, FuncWhenOutSideClick, State = 'Inside') {
    document.addEventListener('click', ClickOutSideCnt = function(event) {
        let IsClickInContainer = Container.contains(event.target);
        if (!IsClickInContainer) {
            if (State == 'OutSide') {
                FuncWhenOutSideClick()
                State = 'Inside'
                document.removeEventListener('click', ClickOutSideCnt)
            }
            State = 'OutSide'
        }
    });
}

////////////////     Click Out Side Container or Not    /////////////////


function ReturnClickInContainer(Container) {
    let StateResult = false
    document.addEventListener('click', ClickInSideOrNot = function(event) {
        let StateClick = Container.contains(event.target)
        if (StateClick) {
            StateResult = true
        }
    })
    document.removeEventListener('click', ClickInSideOrNot)
    return StateResult
}

////////////////     Settings Container Menu    /////////////////


function OpenMenuContainer(Menu) {
    Menu.classList.remove('MenuIsClose')
    Menu.classList.add('MenuIsOpen')
}

function CloseMenuContainer(Menu) {
    Menu.classList.remove('MenuIsOpen')
    Menu.classList.add('MenuIsClose')
}


//////////////////////////////////       Trun Chate Letters   ////////////////////////////////////////////
function TrunCateLetter(Text, ToNumber) {
    Text = String(Text)
    let LenText = Text.length
    let Y = Text.substr(0, ToNumber)
    if (parseInt(LenText) > parseInt(ToNumber)) {
        Y += ' . . .'
    }
    return Y
}

//////////////////////////////////      Full Screen Element   ////////////////////////////////////////////
function OpenFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

//////////////////////////////////       Sign Out Account   ////////////////////////////////////////////
function SignOutAccount(Path = '/') {
    CreateMessage_Alert('ایا مطمعن هستید که میخواهید از حساب کاربری خارج شوید ؟', function() {
        SetCookie('QlYSqVS', 'None*_', '0', Path)
        SetCookie('YPtIeRC', 'None*_', '0', Path)
        location.reload()
    }, Path)
}

//////////////////////////////////       Menu      ////////////////////////////////////////////

function CreateMenu(Content = '', Style = '', Class = '', ID = '') {
    let Container = document.createElement('div')
    Container.className = `_ContainerMenu ${Class}`
    Container.style = Style
    Container.id = ID
    let IconCloseMenu = `<i class="far fa-times IconCloseMenu" IconCloseMenu></i>`
    let Br = `<br>`
    Container.innerHTML = IconCloseMenu
    Container.innerHTML += Br
    Container.innerHTML += Br
    Container.innerHTML += Content
    Container.setAttribute('ContainerMenu', '')
    document.body.appendChild(Container)
    EffectOnBodyMenuIsOpen()
    return Container
}

function EffectOnBodyMenuIsOpen() {
    document.body.classList.add('EffectOnBodyMenuIsOpen')
}


//////////////////////////////////      Menu Touch   ////////////////////////////////////////////


function SetTouchPadOnElement(Element, Type, arguments) {
    if (Type == 'Width') {
        let Direction = arguments.Direction || 'Rtl'
        let Max = arguments.Max || 'WidthWindow'
        let Min = arguments.Min || 0
        let OnTouchEndF = arguments.OnTouchEnd || function() {}
        let OnTouchStartF = arguments.OnTouchStart || function() {}
        Element.classList.add('MenuIsClose')
        Element.ontouchstart = function(e) {
            if (Element.getAttribute('StateOnTouchStart') == 'true') {
                OnTouchStartF(e)
                Element.setAttribute('StateOnTouchStart', 'false')
                Element.classList.remove('MenuIsOpen')
                Element.classList.remove('MenuIsClose')
            }
        }
        Element.ontouchmove = function(e) {
            if (Element == e.target) {
                SetTouchIncreaseWidthElement(Element, e, Direction, Max, Min)
                Element.setAttribute('StateOnTouchStart', 'true')
                Element.style.transition = 'all 0s'
            }
        }
        Element.ontouchend = function(e) {
            OnTouchEndF(e)
            let Element = e.currentTarget
            let ElementInfo = Element.getBoundingClientRect()
            Element.classList.remove('MenuIsOpen')
            Element.classList.remove('MenuIsClose')
            let MaxWidthOpen
            let MaxPX
            let MaxPercentage
            MaxPX = parseInt(Max.split('px')[0])
            MaxWidthOpen = MaxPX
            if (!Number.isInteger(MaxWidthOpen)) {
                MaxPercentage = Number.isInteger(Max.split('%')[0])
                MaxWidthOpen = (Element.parentNode.getBoundingClientRect().width * MaxPercentage) / 100
            }
            if (ElementInfo.width > (MaxWidthOpen / 2 - 20)) {
                OpenMenuHamburger(Element)
            } else {
                CloseMenuHamburger(Element)
            }
            Element.removeAttribute('style')
        }
    } else if (Type == 'Move') {
        Element.ontouchmove = function(e) {
            if (Element == e.target) {
                SetTouchMoveElement(e)
            }
        }
    } else if (Type == 'Both') {
        let Direction = arguments.Direction || 'Rtl'
        let Max = arguments.Max || 'WidthWindow'
        let Min = arguments.Min || 0
        Element.ontouchmove = function(e) {
            SetTouchIncreaseWidthElement(Element, e, Direction, Max, Min)
            SetTouchMoveElement(e)
            Element.style.transition = 'all 0s'
        }
    }
    return Element
}

function CollectionHas(A, B) {
    for (let i = 0, len = A.length; i < len; i++) {
        if (A[i] == B) return true;
    }
    return false;
}

function FindElementParentBySelector(Element, Selector) {
    let All = document.querySelectorAll(Selector);
    let Cur = Element.parentNode;
    while (Cur && !CollectionHas(All, Cur)) {
        Cur = Cur.parentNode;
    }
    return Cur;
}


function SetTouchIncreaseWidthElement(ElementMenu, e, Direction, Max = 'WidthWindow', Min = 0) {
    let UnitWidthX = e.targetTouches[0].clientX
    let WidthWindow = window.outerWidth
    if (Direction == 'Ltr') {
        UnitWidthX = WidthWindow - UnitWidthX
    }
    let Element = e.target
    if (Max != 'WidthWindow') {
        let MaxPX = Max.split('px')[0]
        WidthWindow = Number(MaxPX);
        if (!Number.isInteger(WidthWindow)) {
            let MaxPercentage = Max.split('%')[0]
            WidthWindow = (Element.parentNode.getBoundingClientRect().width * MaxPercentage) / 100
            if (!Number.isInteger(WidthWindow)) {
                throw ('ValueError in ValueType SetTouch Functionality')
            }
        }
    }

    if (UnitWidthX <= WidthWindow && UnitWidthX >= Min) {
        Element.style.width = UnitWidthX + 'px'
        Element.setAttribute('Width', `${UnitWidthX}px`)
    }

}


function SetTouchMoveElement(e) {
    let UnitMoveX = e.targetTouches[0].clientX
    let UnitMoveY = e.targetTouches[0].clientY
    SetElementOnScreenX(e.target, UnitMoveX)
    SetElementOnScreenY(e.target, UnitMoveY)
}


function SetElementOnScreenX(Element, X) {
    let WidthWindow = parseInt(window.outerWidth)
    let InformationElement = Element.getBoundingClientRect()
    let Width = InformationElement.width
    if (X <= WidthWindow && X >= 0) {
        Element.style.left = `${X}px`
        Element.setAttribute('Left', `${X}px`)
    }
}

function SetElementOnScreenY(Element, Y) {
    let HeightWindow = parseInt(window.outerHeight)
    let InformationElement = Element.getBoundingClientRect()
    let Height = InformationElement.height
    if (Y <= HeightWindow && Y >= 0) {
        Element.style.top = `${Y}px`
        Element.setAttribute('Top', `${Y}px`)
    }
}


let VarStateEventClickDoc
let StateSetClickOutSideMenu = true

function SetClickOutSideMenu(Element) {
    if (StateSetClickOutSideMenu) {
        //  RemoveElementWhenPasteToMenu()
        for (let i of Element.children) {
            i.addEventListener('click', function(e) {
                if (e.target.getAttribute('IconCloseMenu') == null) {
                    OpenMenuContainer(Element)
                }
            })
        }
        document.addEventListener('click', VarStateEventClickDoc = function(event) {
            let IconOpenMenu = document.getElementById('IconHamburgerMenu')
            let StateClickMenu = Element.contains(event.target)
            let StateClickIconOpen = IconOpenMenu.contains(event.target)
            if (!StateClickMenu && !StateClickIconOpen) {
                CloseMenuHamburger(Element)
            }
        })
    }
    StateSetClickOutSideMenu = false
}


// let ElementMenuWithTouch = SetTouchPadOnElement(CreateMenu(ElementsInMenu), 'Width', {
//         'Direction': 'Ltr', 'Max': '210px', 'Min': '0', 'OnTouchEnd': function (e) {
//             let Element = e.target
//             let ElementInfo = Element.getBoundingClientRect()
//             Element.classList.remove('MenuIsOpen')
//             Element.classList.remove('MenuIsClose')
//             if (ElementInfo.width > 125) {
//                 OpenMenuHamburger()
//             } else {
//                 CloseMenuHamburger()
//             }
//             Element.removeAttribute('style')
//         }, 'OnTouchStart': function (e) {
//         }
//     }
// ) ------------------------ For Example --------------------------


function OpenMenuHamburger(ElementMenuWithTouch) {
    SetClickOutSideMenu(ElementMenuWithTouch)
    OpenMenuContainer(ElementMenuWithTouch)
}

function OpenMenuHamburgerID(ID) {
    let Element = document.getElementById(ID)
    OpenMenuHamburger(Element)
}


function CloseMenuHamburger(ElementMenuWithTouch) {
    CloseMenuContainer(ElementMenuWithTouch)
}

function CloseMenuHamburgerID(ID) {
    let Element = document.getElementById(ID)
    CloseMenuContainer(Element)
}


//////////////////////////////////      Get And Paste Element To Element   ////////////////////////////////////////////

function PasteElementToElement(Element, ToElement, Attr = '') {
    if (Attr != '' && Attr != ' ') {
        for (let Key in Attr) {
            Element.setAttribute(Key, Attr[Key]);
        }
    }
    ToElement.appendChild(Element)
}

//---------------------                          ClickFunc                           -----------------
// Run Function Passed In Attribute Elements

let AllClickFunc = document.querySelectorAll('[ClickFunc]')
for (let i of AllClickFunc) {
    i.onclick = function(e) {
        try {
            let Element = e.currentTarget
            let ValAttr = Element.getAttribute('ClickFunc')
            let NameFunc = ValAttr.split('(')[0]
            let ValFunc = ValAttr.split('(')[1]
            ValFunc = ValFunc.replace(')', '') || []
            if (typeof ValFunc == "string") {
                ValFunc = new Array(ValFunc)
            }
            let FuncRuned = window[NameFunc].apply(window, ValFunc)

        } catch (e) {
            throw e
            throw (` Attribute "ClickFunc" In One of The Elements or Most Is Wrong`)
        }
    }
}


/*let FuncSetActiveContainer = ActiveContainer
let AttrSearchContainer = 'ContainerItemMenu'
let ValAttrContainerDefault = 'Info'
let UrlContainer = window.location.href
let ValueForItemMenu = UrlContainer.split('?')[1]
if (ValueForItemMenu != undefined && ValueForItemMenu != '' && ValueForItemMenu != ' ') {
    let ItemsInMenuForURL = document.querySelector(`[${AttrSearchContainer}=${ValueForItemMenu}]`)
    if (ValueForItemMenu == 'Home') {
        GoToUrl('/')
    }
    if (ItemsInMenuForURL != null) {
        FuncSetActiveContainer(ItemsInMenuForURL)
    }
} else {
    ItemsInMenuForURL = document.querySelector(`[${AttrSearchContainer}=${ValAttrContainerDefault}]`)
    FuncSetActiveContainer(ItemsInMenuForURL)
}*/


let AllCheckInputVal = document.querySelectorAll('[CheckInputVal]')
for (let i of AllCheckInputVal) {
    let Bigger = i.getAttribute('Bigger')
    let Less = i.getAttribute('Less')
    let TypeVal = i.getAttribute('TypeVal') || 'Text'
    let SetIn = i.getAttribute('SetIn') || 'Input'
    if (TypeVal == 'File') {
        ValidationFile(i)
    } else {
        CheckInputValidations(i, Bigger, Less, SetIn, TypeVal)
    }
}


function ValidationEmail(Email) {
    const Re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return Re.test(String(Email).toLowerCase());
}

function ValidationIsNumber(Text) {
    Text.match(/\D/g)
    let State = false
    if (Text.match(/\D/g) == null && Number.isInteger(parseInt(Text))) {
        State = true
    } else {
        State = false
    }
    return State
}


function ValidationFile(Input) {
    let State = false
    let Value = Input.value
    let StateInputFile = Input.getAttribute('State')
    if (StateInputFile == 'MostGet') {
        if (Value != '' && Value != ' ' && !IsBlank(Value)) {
            State = true
            Input.classList.add('InputValid')
        } else {
            State = false
            Input.classList.remove('InputValid')
            ImageFormInfo.src = ''
        }
        Input.setAttribute('Valid', State)
    } else {
        Input.classList.add('InputValid')
        Input.setAttribute('Valid', 'true')
    }

    return State
}

function ValidationAlphabet(e) {
    let Code = ('charCode' in e) ? e.charCode : e.keyCode;
    let State = false
    if (!(Code == 32) && // space
        !(Code > 47 && Code < 58) &&
        !(Code > 64 && Code < 91) &&
        !(Code > 96 && Code < 123)) {
        State = false
        e.preventDefault();
    } else {
        State = true
    }
    return State
}

function ValidatePassword(value) {
    if ((value.search(/[0-9]/) < 0) && (value.search(/[a-z]/i) < 0)) {
        return false
    } else {
        return true
    }

}

function ValidationInput(Element, Input, Bigger, Less) {

    let Value = Input.value
    let IconState = Element.querySelector('i')
    if (Value != '' && Value != ' ' && Value != null && Value.trim() != '' && CheckInputValidations(Input, parseInt(Bigger), parseInt(Less), 'None')) {
        IconState.className = 'fal fa-check-circle'
        Input.setAttribute('Valid', 'true')
    } else {
        IconState.className = 'fal fa-times-circle'
        Input.setAttribute('Valid', 'false')
    }

}

function ImageExists(ImageUrl) {
    let Ht = new XMLHttpRequest();
    Ht.open('HEAD', ImageUrl, false);
    Ht.send();
    return Ht.status != 404 ? true : false
}

function ValidationOnlyAlephbaAndNumber(e) {
    var code = ('charCode' in e) ? e.charCode : e.keyCode;
    if (!(code == 32) && // space
        !(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
        e.preventDefault();
    }
}


// ----------------------------------   Animation Scroll   ---------------------------
let AllElementsWithAnimation = document.querySelectorAll('[AnimationScroll]')
let AllElementsWithAnimation_2 = document.querySelectorAll('[AnimationScroll_2]')
let ScrollOnElementVar = (entries, Observer) => {
    entries.forEach(Entry => {
        let ClassAnimation = Entry.target.getAttribute('AnimationScroll')
        let ClassAnimation_2 = Entry.target.getAttribute('AnimationScroll_2') || ''
        if (Entry.isIntersecting) {
            Entry.target.classList.add(ClassAnimation)
            try {
                Entry.target.classList.add(ClassAnimation_2)
            } catch (e) {}
        } else {
            // Loop
            // Entry.target.classList.remove(ClassAnimation)
            // Entry.target.classList.remove(ClassAnimation_2)
        }
    })
}


let Observer = new IntersectionObserver(ScrollOnElementVar, {
    threshold: [0.02]
});
AllElementsWithAnimation.forEach(Element => {
    if (Element) {
        Observer.observe(Element)
    }
})

// ------------------------------  Form & Item Form  -------------------------------

function EffectOnItemFormInput(Element) {
    Element.classList.add('ItemFormInputFocus')
}

function ClearEffectOnItemFormInput(Element) {
    Element.classList.remove('ItemFormInputFocus')
}

let AllInputFormBaseJS = document.querySelectorAll('[InputForm]')
for (let I of AllInputFormBaseJS) {
    I.addEventListener('focus', function(e) {
        EffectOnItemFormInput(e.currentTarget.parentNode)
    })
    I.addEventListener('focusout', function(e) {
        ClearEffectOnItemFormInput(e.currentTarget.parentNode)
    })
}


function SignOutAccountMenu() {
    setTimeout(function() {
        CloseMenuContainer(document.getElementById('ContainerMenuHamburger'))
    })
    SignOutAccount()
}



function GetKeyByValue(Obj, Val) {
    return Object.keys(Obj).find(K => Obj[K] === Val);
}



function SendAjax(Url, Data = {}, Method = 'POST', Success, Failed, async_req = true, auth, login_redirect = true) {
    function __Redirect__(response) {
        if (response.__Redirect__ == 'True') {
            setTimeout(function() {
                window.location.href = response.__RedirectURL__
            }, parseInt(response.__RedirectAfter__ || 0))
        }
    }
    let timer_loading

    function Loading(State) {
        if (State == 'Show') {
            LockAllElements()
            timer_loading = setTimeout(function() {
                Loading('Hide')
                let ContainerLoading = document.createElement('div')
                let CircleLoading = document.createElement('div')
                ContainerLoading.id = 'ContainerLoadingAJAX'
                ContainerLoading.classList.add('ContainerLoadingAJAX')
                ContainerLoading.innerHTML = `
                    <div class="LoadingCircle"><span></span></div>
                `
                ContainerLoading.innerHTML = `
                    <img src="assets/img/login.png" alt="logo">
                `
                document.body.classList.add('is-loading')
                document.body.appendChild(ContainerLoading)
            }, 300)

        } else {
            document.body.classList.remove('is-loading')
            try {
                UnlockAllElements()
                document.getElementById('ContainerLoadingAJAX').remove()
            } catch (e) {}
            try {
                clearTimeout(timer_loading)
            } catch (e) {}
        }
    }

    if (Success == undefined) {
        Success = function(response) {
            __Redirect__(response)
        }
    }
    if (Failed == undefined) {
        Failed = function(response) {
            ShowNotificationMessage('Could not connect to server ', 'Error', 10000, 2)
        }
    }
    let headers = {
        // 'X-CSRFToken': window.CSRF_TOKEN
        'Content-Type': 'application/json',
    }

    if (auth) {
        let pizzle = PIZZLE_OBJECT
        let access_token = ''
        let tokens = pizzle.GET_USER_TOKEN(login_redirect)
        if (tokens) {
            access_token = tokens.access
        }
        if (access_token) {
            headers['Authorization'] = `Bearer ${access_token}`
        }
    }

    Loading('Show')
    $.ajax({
        url: Url,
        data: JSON.stringify(Data),
        type: Method,
        async: async_req,
        headers: headers,
        success: function(response) {
            __Redirect__(response)
            Loading('Hide')
            Success(response)
        },
        failed: function(response) {
            __Redirect__(response)
            Loading('Hide')
            Failed(response)
        },
        error: function(response) {
            __Redirect__(response)
            Loading('Hide')
            Failed(response)
        }
    })
}

let LIST_ALL_NOTIFICATIONS_INSTANCE = []
let COUNTER_CREATE_NOTIFICATIONS = 0

class ShowNotificationMessage_Model {
    constructor(Text, Type, Timer = 5000, LevelOfNecessity = 3) {
        COUNTER_CREATE_NOTIFICATIONS += 1
        LIST_ALL_NOTIFICATIONS_INSTANCE.push(this)
        this.ID_Notification = COUNTER_CREATE_NOTIFICATIONS
        this.Index_Notification = LIST_ALL_NOTIFICATIONS_INSTANCE.length - 1

        let ContainerNotifications = document.getElementById('ContainerNotificationsMessage')
        if (ContainerNotifications == undefined) {
            ContainerNotifications = document.createElement('div')
            ContainerNotifications.id = 'ContainerNotificationsMessage'
        }
        let ContainerMessage = document.createElement('div')
        let Message = document.createElement('p')
        let BtnClose = document.createElement('i')
        let Icon = document.createElement('i')

        ContainerMessage.setAttribute('ID_Notification', this.ID_Notification)
        BtnClose.setAttribute('Index_Notification', this.Index_Notification)

        ContainerMessage.classList.add('NotificationMessage')
        ContainerMessage.classList.add(`LevelOfNecessity_${LevelOfNecessity}`)
        ContainerMessage.classList.add(`Notification${Type}`)
        Message.innerText = Text
        BtnClose.className = 'fa fa-times BtnCloseNotification'
        if (Type == 'Success') {
            Icon.className = 'fa fa-check-circle IconNotification IconNotification_Success'
        } else if (Type == 'Error') {
            Icon.className = 'fa fa-times-hexagon IconNotification IconNotification_Error '
        } else if (Type == 'Warning') {
            Icon.className = 'fa fa-exclamation-triangle IconNotification IconNotification_Warning'
        }
        ContainerMessage.appendChild(Icon)
        ContainerMessage.appendChild(BtnClose)
        ContainerMessage.appendChild(Message)
        ContainerNotifications.appendChild(ContainerMessage)
        document.body.appendChild(ContainerNotifications)
        this.ContainerMessage = ContainerMessage
        let Index_Notification = this.Index_Notification
        setTimeout(function() {
            RemoveNotification_Func(Index_Notification)
        }, Timer)

        BtnClose.onclick = function(e) {
            let Index_Notification = e.target.getAttribute('Index_Notification')
            RemoveNotification_Func(Index_Notification)
        }
    }

}

function RemoveNotification_Func(Index) {
    let Instance = LIST_ALL_NOTIFICATIONS_INSTANCE[Index]
    Instance.ContainerMessage.classList.add('Notification_Removed')
    setTimeout(function() {
        Instance.ContainerMessage.remove()
        delete Instance
    }, 300)
}

function ShowNotificationMessage(Text, Type, Timer = 5000, LevelOfNecessity = 3) {
    new ShowNotificationMessage_Model(Text, Type, Timer, LevelOfNecessity)
}


function CreateMessage_Alert(Text, FuncWhenOK, ValueFunc = null, FuncWhenCancel = null) {
    CloseMessage_Alert()
    LockAllElements()
    setTimeout(function() {
        document.body.className = ''

        let Container = document.createElement('div')
        let TextMessage = document.createElement('p')
        let BtnClose = document.createElement('button')
        let BtnOk = document.createElement('button')
        let BtnClose1 = document.createElement('i')


        Container.className = 'ContainerMessage_Alert'
        TextMessage.className = 'TextMessage_Alert'
        BtnClose.className = 'BtnClose_Alert'
        BtnOk.className = 'BtnOk_Alert'
        BtnClose1.className = 'fa fa-times BtnClose1_Alert'

        TextMessage.innerHTML = Text
        BtnClose.innerText = 'بازگشت'
        BtnOk.innerText = 'بله'

        BtnClose.onclick = function() {
            if (FuncWhenCancel != null) {
                FuncWhenCancel()
            }
            CloseMessage_Alert()
        }
        BtnClose1.onclick = function() {
            if (FuncWhenCancel != null) {
                FuncWhenCancel()
            }
            CloseMessage_Alert()
        }

        BtnOk.onclick = function() {
            if (ValueFunc != null) {
                FuncWhenOK(ValueFunc)
            } else {
                FuncWhenOK()
            }
            CloseMessage_Alert()
        }

        Container.appendChild(TextMessage)
        Container.appendChild(BtnClose)
        Container.appendChild(BtnClose1)
        Container.appendChild(BtnOk)
        ClickOutSideContainer(Container, function() {
            CloseMessage_Alert()
        }, 'OutSide')
        document.body.insertBefore(Container, document.body.firstElementChild)
        BlurAllElementsExceptMessage_Alert()

        // Focus on Button Ok
        BtnOk.focus()
    })
}


function CloseMessage_Alert() {
    try {
        document.getElementsByClassName('ContainerMessage_Alert')[0].remove()
    } catch (e) {}
    UnlockAllElements()
    Clear_BlurAllElementsExceptMessage_Alert()
}

function BlurAllElementsExceptMessage_Alert() {
    document.body.classList.add('BlurAllElementsExceptMessage_Alert')
    document.body.style.overflow = 'hidden'
}

function Clear_BlurAllElementsExceptMessage_Alert() {
    document.body.classList.remove('BlurAllElementsExceptMessage_Alert')
    document.body.style.overflow = ''
}


function LockAllElements() {
    $('body *').prop('disabled', true)
}

function UnlockAllElements() {
    $('body *').prop('disabled', false)
    $('input[type=checkbox]').prop('disabled', true)
    $('#ContainerForm input[type=radio]').prop('disabled', true)
    $('#ContainerForm input[type=file]').prop('disabled', true)
}

/////////////////////// Timer Counter Down

function RunAllCounterTimers() {
    let TagsWithTimer = document.querySelectorAll('[TimerCounterDown]')
    for (let T of TagsWithTimer) {
        let ToDate = T.getAttribute('ToDateTimer')

        TimerCountDown(T, ToDate)
    }
}

let TagsWithTimer = document.querySelectorAll('[TimerCounterDown]')
for (let T of TagsWithTimer) {
    let ToDate = T.getAttribute('ToDateTimer')

    TimerCountDown(T, ToDate)
}

function TimerCountDown(Element, ToDate) {
    let CountDownDate = new Date(ToDate)
    let El_Second = Element.querySelector('[data-content=Second]')
    let El_Minute = Element.querySelector('[data-content=Minute]')
    let El_Hour = Element.querySelector('[data-content=Hour]')
    let El_Day = Element.querySelector('[data-content=Day]')
    let _ = setInterval(function() {
        let Now = new Date().getTime();
        let Distance = CountDownDate - Now;
        let Days = Math.floor(Distance / (1000 * 60 * 60 * 24));
        let Hours = Math.floor((Distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let Minutes = Math.floor((Distance % (1000 * 60 * 60)) / (1000 * 60));
        let Seconds = Math.floor((Distance % (1000 * 60)) / 1000);
        if (Distance < 0) {
            clearInterval(_);
            El_Second.innerHTML = 0
            El_Minute.innerHTML = 0
            El_Hour.innerHTML = 0
            El_Day.innerHTML = 0
        } else {
            El_Second.innerHTML = Seconds
            El_Minute.innerHTML = Minutes
            El_Hour.innerHTML = Hours
            El_Day.innerHTML = Days
        }
    }, 1000);
}