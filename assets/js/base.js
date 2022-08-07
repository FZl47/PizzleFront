// Init
const URL_DOMAIN_BACKEND = 'http://127.0.0.1:8000'
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


function event_input_quantity(input) {
    let max = parseInt(input.attr('max'))
    let value = parseInt(input.val())
    if (value > max) {
        input.val(max)
    }
}

function GET_USER_TOKEN(go_to_login = true) {

    let refresh = GetCookieByName('refresh-user')
    let access = GetCookieByName('access-user')

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

class PIZZLE {

    constructor(get_user = false) {
        let This = this
        this._details_func = {}
        this.COUNTER_TRY_GET_TOKENS = 3
        this.COUNTER_TRY_ADD_TO_CART = 1
        this.COUNTER_TRY_GET_USER = 2
        this.USER = null
        if (get_user) {
            This.GET_USER()
        }

    }

    SET_CONF_OWL = function () {
        $(".pizza_slide").owlCarousel({
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
                    items: 2
                },
                1000: {
                    items: 3
                },
                1200: {
                    items: 3
                }
            }
        });

        var selector = $('.pizza_slide');

        $('.next_slide').click(function () {
            selector.trigger('next.owl.carousel');
        });

        $('.prev_slide').click(function () {
            selector.trigger('prev.owl.carousel');
        });
    }

    GET_USER = function () {
        let url = this.URL('user/get-user')
        let details = this.SEND_AJAX_SYNC(url, {}, false, true, false, false)
        let status = details.status
        if (status == 200) {
            this.USER = details.data.user
        } else if (status == 401) {
            if (this.COUNTER_TRY_GET_USER > 0) {
                this.COUNTER_TRY_GET_USER -= 1
                this.GET_USER()
            }
        }
    }

    URL = function (url, slash = false, arg = null) {
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

    URL_TEMPLATE = function (name_template, arg = null) {
        if (!arg) {
            return `${name_template}`
        } else {
            return `${name_template}?${arg[0]}=${arg[1]}`
        }
    }

    UPDATE_TOKEN_USER = function (refresh, login_redirect = false) {
        let url = this.URL('user/token/get-access-token')
        let details = this.SEND_AJAX_SYNC(url, {
            'refresh': refresh
        }, false)
        if (details.status == 200) {
            this._SET_ACCESS_TOKEN(details.data.access)
            return true
        } else if (details.status == 401 && login_redirect) {
            window.location.href = PAGE_LOGIN
        } else {
            return false
        }
    }

    _GET_REFRESH_TOKEN = function () {
        return GetCookieByName('refresh-user')
    }

    _GET_ACCESS_TOKEN = function () {
        return GetCookieByName('access-user')
    }

    _SET_REFRESH_TOKEN = function (refresh_token, remember_me) {
        let expire_day = remember_me == true ? 30 : 'Session'
        SetCookie('refresh-user', refresh_token, expire_day)
    }

    _SET_ACCESS_TOKEN = function (access_token) {
        let date = new Date();
        date.setTime(date.getTime() + (20 * 60 * 1000));
        let expire_minute = date
        SetCookie('access-user', access_token, expire_minute)
    }

    GET_USER_TOKEN = function (go_to_login = true) {

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

    VIEW_ERROR_500 = function () {
        window.location.href = PAGE_ERROR_500
    }

    VIEW_ERROR_404 = function () {
        window.location.href = PAGE_ERROR_404
    }

    SEND_AJAX_SYNC = function (url, data, error_message = true, auth = false, error_redirect = true, login_redirect = false, method = 'POST') {
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
            function (response) {

                if (response.success) {
                    // Success
                    SET_DETAILS(response.status_code, response.message, response.data)
                } else {
                    // Failed
                    let status = response.status_code

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
                            let state_update_token = This.UPDATE_TOKEN_USER(This._GET_REFRESH_TOKEN(), login_redirect)
                            if (state_update_token) {
                                This.COUNTER_TRY_GET_TOKENS = 3
                            } else {
                                // This.VIEW_ERROR_500()
                            }
                        }
                    }

                    SET_DETAILS(parseInt(status), response.error, response.data)

                    if (error_message) {
                        let error_text = response.error
                        ShowNotificationMessage(error_text, 'Error')
                    }
                }
            }, false, auth, login_redirect)
        return details
    }

    SEND_AJAX = function (url, data, {error_message = true, auth = false, error_redirect = true, login_redirect = false, response, failed, method = 'POST', loading_show = true, loading_section = null} = {}) {
        let This = this
        let response_callback = response
        let failed_callback = failed

        function response_call(response) {
            if (response_callback) {
                response_callback(response)
            } else if (failed_callback) {
                failed_callback(response)
            }
        }

        SendAjax(url, data, method,
            function (response) {

                if (response.success == true) {
                    // Success
                    response_call({
                        'status': response.status_code,
                        'message': response.message,
                        'data': response.data,
                        'success': true
                    })
                } else {
                    // Failed
                    let status = response.status_code
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
                            let state_update_token = This.UPDATE_TOKEN_USER(This._GET_REFRESH_TOKEN(), login_redirect)
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
                    if (error_message && status != 0) {
                        let error_text = response.error
                        ShowNotificationMessage(error_text, 'Error')
                    }
                    response_call({
                        'status': response.status_code,
                        'message': response.error,
                        'data': response.data,
                        'success': false
                    })
                }
            },
            true, auth, login_redirect, loading_show, loading_section
        )

    }


    GET_HTML_ELEMENT_COMMENT = function (comment) {
        let comment_state_rate = ''
        let rate = parseFloat(comment.rate)
        if (rate > 2.5) {
            comment_state_rate = `
               <i class="fas fa-plus"></i>
            `
        } else if (rate < 2.5) {
            comment_state_rate = `
                <i class="fas fa-minus"></i>
            `
        } else {
            comment_state_rate = `
                <i class="fas fa-equals"></i>
            `
        }

        return `
            <div class="single-comment-box">
                <div class="main-comment">
                <div class="author-image">
                    <img src="${comment.user.image}" alt="${comment.user.name}">
                </div>
                <div class="comment-text">
                    <div class="comment-info">
                        <div>
                            <h4>${comment.user.name}</h4>
                            <div class="ratings-container d-inline-block text-center mx-2 w-auto">
                                <div class="ratings">
                                    <div class="ratings-val" id="rating-val" style="width: ${rate * 20}%"></div>
                                </div>
                            </div>
                            <p>${comment.time_send}</p>
                        </div>
                        <div class="icon-state-rate">
                            ${comment_state_rate}
                        </div>
                    </div>
                    <div class="comment-text-inner">
                        <p>${comment.text}</p>
                    </div>
                </div>
                </div>
            </div>
        `
    }

    CREATE_ELEMENT_COMMENT = function (container, node_comment, insert_before = false) {
        if (insert_before) {
            container.insertAdjacentHTML('beforeend', node_comment)
        } else {
            container.innerHTML += node_comment
        }
    }

    SHOW_NOT_FOUND_COMMENT = function (container) {
        container.innerHTML = `
            <div class="not-found-comment">
                <p>no comment</p>
            </div>
        `
    }


    NOTIFY_ME = function (slug, func) {
        let url = this.URL('food/notify')
        this.SEND_AJAX(url, {
            'slug': slug
        }, {'error_message': false, 'auth': true, 'login_redirect': true, 'response': func})
    }


    GET_ALL_MEALS = function (data = {}, func) {
        let url = this.URL('food/get-meals')
        this.SEND_AJAX(url, data, {'error_message': true, 'response': func})
    }

    GET_MEALS_BY_CATEGORY = function (data = {}, func) {
        let url = this.URL('food/get-meals-by-category')
        this.SEND_AJAX(url, data, {'error_message': false, 'response': func})
    }

    GET_MEALS_WITH_DISCOUNT(func) {
        let url = this.URL('food/get-meals-discounts')
        this.SEND_AJAX(url, {}, {'response': func})
    }

    GET_MEALS_POPULAR(data = {}, func) {
        let url = this.URL('food/get-meals-popular')
        this.SEND_AJAX(url, data, {'response': func})
    }

    ADD_TO_CART_BTN(slug, btn) {
        this.ADD_TO_CART(slug)
    }

    ADD_TO_CART(slug, count = 1) {
        let This = this
        let url = this.URL('user/cart/add')
        let data = {
            'slug': slug,
            'count': count
        }
        this.SEND_AJAX(url, data, {
            'error_message': false,
            'auth': true,
            'error_message': false,
            'login_redirect': true,
            'response': function (response) {
                let status = response.status
                if (status == 401) {
                    if (This.COUNTER_TRY_ADD_TO_CART > 0) {
                        This.COUNTER_TRY_ADD_TO_CART -= 1
                        This.ADD_TO_CART(slug, count)
                    }
                }
                if (status == 200) {
                    This.COUNTER_TRY_ADD_TO_CART = 1
                    ShowNotificationMessage(response.message, 'Success', 4000, 1)
                }
                if (status != 200 && status != 401) {
                    ShowNotificationMessage(response.message, 'Error', 5000, 2)
                }
            }
        })

    }

    GET_HTML_ELEMENT_MEAL(meal) {
        let This = this
        let is_available = meal.is_available

        let discount = meal.discount

        let element_discount = ''
        if (discount && is_available) {
            element_discount = `
                <div class="pizza_discount">
                    <p class="pizza_discount_percentage">${meal.discount_percentage}%</p>
                </div>
            `
        }

        let rate_percentage = parseFloat(meal.rate) * 20
        let element_rate = `
                <div class="ratings-container">
                    <div class="ratings">
                        <div class="ratings-val" style="width: ${rate_percentage}%"></div>
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
                        ${
            is_available == true ? ` <button onclick="PIZZLE_OBJECT.ADD_TO_CART_BTN('${slug_add_to_cart}',this)" btn-add-to-cart="${slug_add_to_cart}" ><i class="fas fa-shopping-cart"></i> Add to cart</button>` : ''
        }
                    </div>
                </div>
                ${element_info}
                <div class="pizza_slide_text">
                    <h3><a href="${slug}">${meal.title_short}</a></h3>
                    <p>${meal.description_short}</p>
                    ${
            is_available == true ? `<h3 class="pizza_slide_price"><span class="currencySymbol">${SYMBOL_CURRENCY}</span>${meal.price}</h3>` : `<h6>unavailable</h6>`
        }
                </div>
            </div> 
        `
        return node
    }

    GET_HTML_ELEMENT_SUBMEAL = function (stock_meal) {
        let This = this
        let meal = stock_meal.meal
        let count = stock_meal.count

        // let discount = meal.discount

        // let element_discount = ''
        // if (discount) {
        //     element_discount = `
        //         <div class="pizza_discount">
        //             <p class="pizza_discount_percentage">${meal.discount_percentage}%</p>
        //         </div>
        //     `
        // }

        let rate_percentage = parseFloat(meal.rate) * 20
        let element_rate = `
                <div class="ratings-container">
                    <div class="ratings">
                        <div class="ratings-val" style="width: ${rate_percentage}%"></div>
                    </div>
                </div>
        `

        let element_count = ``
        if (count > 1) {
            element_count = `
                <p>${count}x</p>
            `
        }

        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])

        let node = `
            <div class="pizza_item_small">
                <div class="pizza_slide_header">
                    ${element_count}${element_rate}
                </div>
                <div class="pizza_slide_img">
                    <img src="${meal.cover_image}" alt="${meal.title_short}" />
                </div>
                <div class="pizza_slide_text">
                    <h3><a href="${slug}">${meal.title_short}</a></h3>
                </div>
            </div> 
        `
        return node
    }

    GET_HTML_ELEMENT_MEALDETAIL = function (detail) {
        let This = this
        let meal = detail.meal
        let count = detail.count


        // let rate_percentage = parseFloat(meal.rate) * 20
        // let element_rate = `
        //         <div class="ratings-container">
        //             <div class="ratings">
        //                 <div class="ratings-val" style="width: ${rate_percentage}%"></div>
        //             </div>
        //         </div>
        // `

        let element_count = ``
        if (count > 1) {
            element_count = `
                <p>${count}x</p>
            `
        }

        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
        let node = `
            <div class="pizza_item_detail">
                <div class="pizza_slide_header">
                    ${element_count}
                </div>
                <div class="pizza_slide_img">
                    <img src="${meal.cover_image}" alt="${meal.title_short}" title="${meal.title_short}" onclick="GoToUrl('${slug}')" />
                </div>
                <div class="pizza_slide_text">
                    <h3><a href="${slug}">${meal.title_short}</a></h3>
                </div>
            </div> 
        `
        return node
    }

    GET_HTML_ELEMENT_MEAL_POPULAR = function (meal) {
        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
        let rate_percentage = parseFloat(meal.rate) * 20
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

    subscribe_unsubscribe() {
        let email = document.getElementById('input-subs-news')
        if (CheckInputValidations(email,3,100,'None','Email')) {
            let url = this.URL('subscribe')
            this.SEND_AJAX(url,{
                'email':email.value
            },{
                error_redirect:false,
                error_message:true,
                loading_section:document.querySelector('.subscribe_inn'),
                response:function (response) {
                    if (response.success){
                        ShowNotificationMessage(response.message,'Success')
                    }
                }
            })
        }
    }

}

class Home extends PIZZLE {
    constructor() {
        super()
        this.COUNTER_TRY_GET_INFO = 3
        new Header('home')
        new SubscribeNews()
        new Footer()
        let This = this


        this.container_meals_discount = document.getElementById('container-meals-discount')
        this.container_meals_popular = document.getElementById('container-meals-popular')

        this.get_info()
        this.GET_MEALS_WITH_DISCOUNT(function (response) {
            let meals_discount = response.data
            for (let meal of meals_discount) {
                This.CREATE_ELEMENT_MEAL(meal, This.container_meals_discount)
            }
            This.set_conf_owl_discountpizza()

            if (meals_discount.length == 0) {
                document.getElementById('pizza_slider_area_discount').classList.add('d-none')
            }
        })
        this.GET_MEALS_POPULAR({}, function (response) {
            let meals_popular = response.data
            for (let meal of meals_popular) {
                This.CREATE_ELEMENT_MEAL(meal, This.container_meals_popular)
            }
            This.set_conf_owl_popularpizza()
        })
    }

    set_conf_owl_popularpizza = function () {
        $("#container-meals-popular").owlCarousel({
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
                    items: 2
                },
                1000: {
                    items: 3
                },
                1200: {
                    items: 3
                }
            }
        });
        var selector = $('#container-meals-popular');

        $('#container-meals-popular .next_slide').click(function () {
            selector.trigger('next.owl.carousel');
        });

        $('#container-meals-popular .prev_slide').click(function () {
            selector.trigger('prev.owl.carousel');
        });
    }
    set_conf_owl_discountpizza = function () {
        $("#container-meals-discount").owlCarousel({
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
                    items: 2
                },
                1000: {
                    items: 3
                },
                1200: {
                    items: 3
                }
            }
        });

        var selector = $('#container-meals-discount');

        $('#container-meals-discount .next_slide').click(function () {
            selector.trigger('next.owl.carousel');
        });

        $('#container-meals-discount .prev_slide').click(function () {
            selector.trigger('prev.owl.carousel');
        });
    }

    get_info = function () {
        let This = this
        let url = this.URL('')
        this.SEND_AJAX(url, {}, {
            'error_message': false, 'response': function (response) {
                if (response.status == 401) {
                    if (This.COUNTER_TRY_GET_INFO > 0) {
                        This.COUNTER_TRY_GET_INFO -= 1
                        This.get_info()
                    }
                }
                if (response.status == 200) {
                    This.COUNTER_TRY_GET_INFO = 3
                }
            }
        })

    }
}

class Login extends PIZZLE {
    constructor() {
        super()
    }

    login = function (username, password, func) {
        let url = this.URL('user/login')
        this.SEND_AJAX(url, {
            'email': username,
            'password': password
        }, {'error_message': false, 'error_redirect': false, 'response': func})
    }

}

class SignUp extends PIZZLE {
    constructor() {
        super()
    }

    register = function (username, password, password2, func) {
        let url = this.URL('user/register')
        this.SEND_AJAX(url, {
            'email': username,
            'password': password,
            'password2': password2,
        }, {'error_message': false, 'error_redirect': false, 'response': func})
    }
}

class ResetPassword extends PIZZLE {
    constructor() {
        super()
    }

    send_code = function (email, func, btn) {
        let url = this.URL('user/reset-password/get-code')
        this.SEND_AJAX(url, {
            'email': email
        }, {'error_message': false, 'error_redirect': false, 'response': func, 'loading_section': btn})
        this.EMAIL = email
    }

    check_code = function (code, func) {
        let url = this.URL('user/reset-password/validate-code')
        this.SEND_AJAX(url, {
            'email': this.EMAIL,
            'code': code
        }, {'error_message': false, 'error_redirect': false, 'response': func})
        this.CODE = code
    }

    set_password = function (password, password2, func) {
        let url = this.URL('user/reset-password/set-password')
        this.SEND_AJAX(url, {
            'email': this.EMAIL,
            'code': this.CODE,
            'password': password,
            'password2': password2
        }, {'error_message': false, 'error_redirect': false, 'response': func})
    }
}

class Food extends PIZZLE {
    constructor() {
        super(true)
        new Header('food',false)
        new SubscribeNews()
        new Footer()
        this.url_params = new URLSearchParams(window.location.search)
        this.container_related = document.getElementById('container-related-foods')
        this.MEAL = null
        this.set_info()

        this.comment_init()
    }


    comment_init = function () {
        let This = this
        let message_form = document.getElementById('message-form')
        let must_login = document.getElementById('must-login')
        let form_comment = document.getElementById('form-comment')
        form_comment.classList.add('loading-section-large')
        let btn_submit_comment = document.getElementById('btn-submit-comment')
        let input_comment = form_comment.querySelector('textarea')
        if (this.USER) {
            btn_submit_comment.addEventListener('click', function () {
                if (rate_comment && input_comment.value) {
                    message_form.innerText = ''
                    post_comment(input_comment.value, rate_comment)
                } else {
                    message_form.innerText = 'Please enter the fields correctly'
                    message_form.setAttribute('message-type', 'alert-text')
                }
            })
        } else {
            must_login.classList.remove('d-none')
            form_comment.classList.add('d-none')
        }

        function post_comment(comment, rate) {
            let url = This.URL('food/comment/submit')
            let details = This.SEND_AJAX(url, {
                'comment': comment,
                'rate': rate,
                'slug': This.MEAL.slug
            }, {
                'auth': true, 'loading_section': form_comment, 'login_redirect': true, 'response': function (response) {
                    if (response.status == 200) {
                        document.getElementById('leave-commet').innerHTML = `
                        <div class="submited-checkmark">
                            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                            <p>
                                ${response.message}
                            </p>
                        </div>
                    `
                    }
                }
            })

        }
    }

    related_meals = function () {
        let This = this
        let data = {
            'category_slug': this.MEAL.category.slug,
            'slug': this.MEAL.slug
        }
        this.GET_MEALS_BY_CATEGORY(data, function (response) {
            if (response.status == 200) {
                let meals = response.data.meals
                for (let meal of meals) {
                    This.CREATE_ELEMENT_MEAL(meal, This.container_related)
                }
                This.SET_CONF_OWL()
            }
        })

    }

    get_info = function (func) {
        let This = this
        let slug = this.url_params.get('slug')
        if (!slug) {
            this.VIEW_ERROR_404()
        }
        let url = this.URL('food/get-meal')
        let details = this.SEND_AJAX(url, {
            'slug': slug
        }, {
            'error_message': false, 'auth': true, 'response': function (response) {
                let status = response.status
                if (status == 404) {
                    This.VIEW_ERROR_404()
                }
                func(response)
            }
        })

    }

    set_info(data) {
        let This = this
        this.get_info(function (response) {
            let data = response.data

            This.MEAL = data
            This.related_meals()
            let is_available = data.is_available


            // Elements
            let title_el = document.getElementById('title')
            let category_el = document.getElementById('category')
            let rating_val_el = document.getElementById('rating-val')
            let comments_count_rating = document.getElementById('comments-count-rating')
            let comments_count = document.getElementById('comments-count')
            let price_el = document.getElementById('price')
            let description_el = document.getElementById('description')
            let quantity_el = document.getElementById('quantity')
            let container_quantity_el = document.getElementById('container-quantity')
            let btn_add_to_cart_el = document.getElementById('btn-add-to-cart')
            let btn_let_me_know = document.getElementById('btn-let-me-know')
            let container_images = document.getElementById('container-images')
            let container_comments = document.getElementById('comments')
            let container_meals_group = document.getElementById('meals-group')
            let breadcrumb_title_el = document.getElementById('breadcrumb-title')

            // Data 
            title_el.innerText = data.title
            category_el.innerText = data.category.title
            category_el.href = This.URL_TEMPLATE(PAGE_MEALS, ['category', data.category.slug])
            rating_val_el.style.width = (parseFloat(data.rate) * 20) + '%'
            description_el.innerText = data.description
            quantity_el.max = data.stock
            breadcrumb_title_el.innerText = data.title_short


            // Event
            if (is_available) {
                btn_add_to_cart_el.addEventListener('click', function () {
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

                btn_let_me_know.addEventListener('click', function () {
                    This.NOTIFY_ME(This.MEAL.slug, function (response) {
                        let status = response.status
                        if (status == 200) {
                            let is_active = response.data.notify_is_active
                            toggleContentNotify(btn_let_me_know, is_active)
                        }
                    })


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


            // Comments 
            for (let comment of data.comments) {
                This.CREATE_ELEMENT_COMMENT(container_comments, This.GET_HTML_ELEMENT_COMMENT(comment))
            }

            if (data.comments.length == 0) {
                This.SHOW_NOT_FOUND_COMMENT(container_comments)
            }

            comments_count.innerText = data.comments.length
            comments_count_rating.innerText = data.comments.length


            if (data.type == 'group') {
                // Meals Group

                // ---Foods
                for (let food_stock of data.foods) {
                    let node = This.GET_HTML_ELEMENT_SUBMEAL(food_stock)
                    container_meals_group.innerHTML += node
                }

                // ---Drinks
                for (let drink_stock of data.drinks) {
                    let node = This.GET_HTML_ELEMENT_SUBMEAL(drink_stock)
                    container_meals_group.innerHTML += node
                }
            } else {
                container_meals_group.classList.add('d-none')
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

                $('.next_image').click(function () {
                    selector.trigger('next.owl.carousel');
                });

                $('.prev_image').click(function () {
                    selector.trigger('prev.owl.carousel');
                });
            }
        })

    }

}

class Foods extends PIZZLE {
    constructor() {
        super()
        new Header('foods')
        new SubscribeNews()
        new Footer()
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
    }

    active_element_param_search = function () {

        // active category searched
        let category_search = this.url_params.get('category')
        if (category_search && category_search != 'all') {
            try {
                document.querySelector(`[slug="${category_search}"]`).classList.add('category-active')
            } catch (e) {
            }
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
        } catch (e) {
        }

    }

    set_event_input_sortby = function () {
        let This = this
        this.sort_by.addEventListener('change', function (e) {
            let category = This.url_params.get('category') || 'all'
            let new_url = new URLSearchParams(window.location.search);
            new_url.set('sort-by', This.sort_by.value)
            window.location.search = new_url
        })
    }

    pagination_meals = function (pagination) {
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

    go_to_page = function (page_num) {
        let url_search = new URLSearchParams(window.location.search)
        url_search.set('page', page_num)
        window.location.search = url_search
    }


    get_and_create_meals = function () {
        let This = this
        let category = this.url_params.get('category')
        let sort_by = this.url_params.get('sort-by')
        let page = this.url_params.get('page')
        let search = this.url_params.get('search')
        let func = function (response) {
            let meals = response.data.meals
            for (let meal of meals) {
                This.CREATE_ELEMENT_MEAL(meal)
            }
            This.pagination_meals(response.data.pagination)
            This.count_results.innerHTML = meals.length
            if (meals.length < 1) {
                This.show_not_found_meal(This.container_meals)
            }
        }
        if (search) {
            this.get_meals_by_search(search)
        } else {
            if (category) {
                this.GET_ALL_MEALS({
                    'category_slug': category,
                    'sort_by': sort_by,
                    'page': page
                }, func)
            } else {
                this.GET_ALL_MEALS({
                    'sort_by': sort_by,
                    'page': page
                }, func)
            }
        }

    }

    get_meals_popular = function () {
        let This = this
        this.GET_MEALS_POPULAR({
            'count_show': 6
        }, function (response) {
            let meals = response.data
            for (let meal of meals) {
                This.CREATE_ELEMENT_MEAL_POPULAR(meal, This.container_meals_popular)
            }
        })

    }


    get_meals_by_search = function (search_value) {
        let This = this
        this.input_search.value = search_value
        let page = this.url_params.get('page')
        let sort_by = this.url_params.get('sort-by')
        let url = this.URL('food/get-meals-by-search')
        this.SEND_AJAX(url, {
            'search_value': search_value,
            'sort_by': sort_by,
            'page': page
        }, {
            'response': function (response) {
                let meals = response.data.meals
                for (let meal of meals) {
                    This.CREATE_ELEMENT_MEAL(meal)
                }
                This.pagination_meals(response.data.pagination)
                This.count_results.innerHTML = meals.length
                if (meals.length < 1) {
                    This.show_not_found_meal(This.container_meals)
                }
            }
        })
    }

    CREATE_ELEMENT_MEAL = function (meal) {
        let container = document.createElement('div')
        container.className = 'col-lg-4 col-sm-6'
        let node = this.GET_HTML_ELEMENT_MEAL(meal)
        container.innerHTML = node
        this.container_meals.appendChild(container)
    }


    set_value_search_in_url = function () {
        let value_search = this.input_search.value
        window.location.href = this.URL_TEMPLATE(PAGE_MEALS, ['search', value_search])
    }


    get_categories = function () {
        let This = this
        let url = this.URL('food/get-categories')
        this.SEND_AJAX(url, {}, {
            'response': function (response) {
                let categories = response.data
                for (let category of categories) {
                    let slug = This.URL_TEMPLATE(PAGE_MEALS, ['category', category.slug])
                    let node = `
                        <li slug="${category.slug}"><a href="${slug}">${category.title}</a></li>
                    `
                    This.container_categories.innerHTML += node
                }
                This.active_element_param_search()
            }
        })
    }
}

class Gallery extends PIZZLE {
    constructor() {
        super()
        new Header('gallery')
        new Footer()
        let This = this
        this.pagination = null
        let page_at_url = this.get_page_at_url()
        this.get_info(page_at_url)
        this.is_loading_more = false
        this.btn_load_more = document.getElementById('btn-load-more')
        this.btn_load_more.addEventListener('click', function () {
            This.load_more_image()
        })
    }

    get_page_at_url = function () {
        let url = new URL(window.location.href);
        let page = url.searchParams.get('page') || 1
        return page
    }

    set_page_in_url = function (page) {
        window.history.replaceState(null, null, `?page=${page}`)
    }

    get_info = function (page = 1, loading_show = true, callback = undefined) {
        let This = this
        let url = this.URL('gallery/get')
        this.SEND_AJAX(url, {
            'page': page
        }, {
            'loading_show': loading_show,
            'response': function (response) {
                if (response.success) {
                    let pagination = response.data.pagination
                    This.pagination = pagination
                    if (pagination.has_next == false) {
                        This.btn_load_more.remove()
                    }
                    This.set_info(response.data.images)
                    This.load_more_end()
                    if (callback) {
                        callback(response)
                    }
                }
            }
        })
    }

    get_node_element_image = function (image) {
        let node = `    
            <div class="col-lg-4 col-sm-6 d-inline-block mx-3">
                <a href="${image.url}" class="gallery-lightbox">
                    <div class="gallery_item">
                        <img src="${image.url}" alt="gallery" />
                        <div class="gallery_icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                        </div>
                        <div class="gallery_info">
                            <h3>${image.title}</h3>
                        </div>
                    </div>
                </a>
            </div>
        `
        return node
    }

    set_gallery_conf = function () {
        $(".gallery-lightbox").magnificPopup({
            type: 'image',
            gallery: {
                enabled: true
            },
            zoom: {
                enabled: true,
                duration: 300,
                easing: 'ease-in-out',
                opener: function (openerElement) {
                    return openerElement.is('img') ? openerElement : openerElement.find('img');
                }
            }
        });
    }

    set_info = function (images) {
        let container = document.getElementById('gallery')
        for (let image of images) {
            container.innerHTML += this.get_node_element_image(image)
        }
        this.set_gallery_conf()
        if (images.length == 0) {
            container.innerHTML = `
                <div class="not-found">
                    <p>not found image</p>
                </div>
                <a href="index.html" class="cta_btn d-block col-8 col-md-4 col-lg-2 mx-auto">Home</a>
            `
            document.getElementById('btn-load-more').classList.add('d-none')
        }
    }

    load_more_image = function () {
        let This = this
        let btn_load = this.btn_load_more
        if (this.is_loading_more == false) {
            this.load_more_start()
            this.get_info(this.pagination.page_next, false, function (response) {
                This.set_page_in_url(This.pagination.page_active)
            })
        }
    }

    load_more_start = function () {
        this.is_loading_more = true
        this.btn_load_more.setAttribute('loading', 'true')
    }

    load_more_end = function () {
        this.is_loading_more = false
        this.btn_load_more.setAttribute('loading', 'false')
    }

}

class Cart extends PIZZLE {
    constructor() {
        super();
        new Header('cart')
        new SubscribeNews()
        new Footer()
        GetCookieFunctionality_ShowNotification()
        let This = this
        this.COUNTER_TRY_GET_USER_CART = 2
        this.ID_ADDRESS = null
        this.ADDRESS = {
            'id': null,
            'cost': 0
        }
        this.ORDER = null
        this.container_order_details = document.getElementById('container-order-details')
        this.container_subtotal = document.getElementById('subtotal')
        this.container_subtotal_without_discount = document.getElementById('subtotal-without-discount')
        this.container_total = document.getElementById('total')
        this.container_address = document.getElementById('container-address')
        this.container_address_notfound = document.getElementById('container-address-notfound')
        this.input_description = document.getElementById('input-description-order')
        this.btn_add_address = document.getElementById('btn-add-address')
        this.btn_pay = document.getElementById('btn-pay')
        this.cost_shipping = document.getElementById('cost-shipping')
        this.get_info()
        this.btn_pay.addEventListener('click', function () {
            let address_id = This.ADDRESS.id
            if (address_id) {
                alert('Transferring to the banking portal')
                let url = This.URL('user/cart/pay')
                let data = {
                    'address_id': address_id,
                    'description': This.input_description.value
                }
                This.SEND_AJAX(url, data, {
                    error_message: true,
                    auth: true,
                    error_redirect: false,
                    login_redirect: true,
                    response: function (response) {
                        if (response.success) {
                            SetCookieFunctionality_ShowNotification('Your order has been successfully placed', 'Success', 6000, 3)
                            location.reload()
                        }
                    }
                })
            } else {
                ShowNotificationMessage('Please Select address', 'Error')
            }
        })
    }


    get_node_element_orderdetail(order_detail) {
        let meal = order_detail.meal
        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
        let node_discount = ''
        if (meal.discount) {
            node_discount = `
                <p class="discount-perentage-cart">${meal.discount_percentage}</p>
            `
        }

        let node = `
            <tr class="shop-cart-item" id="orderdetail-${order_detail.id}">
                <td class=" cart-preview">
                    <a href="${slug}">
                        <img src="assets/img/pizza_slide_3.png" alt="cart-1">
                    </a>
                </td>
                <td class=" cart-product">
                    <a href="${slug}"> 
                        <p>${meal.title_short}</p>
                    </a>
                </td>
                <td>
                         ${node_discount}
                </td>
                <td class=" cart-price">
                    <p>${SYMBOL_CURRENCY}${meal.price_without_discount}</p>
                </td>
                <td class=" cart-quantity">
                    <div class="num-block skin-2">
                        <div class="num-in">
                            <span class="minus dis"></span>
                            <input type="text" class="in-num" orderdetail-id="${order_detail.id}" min="1" max="${meal.stock}"  value="${order_detail.count}" readonly="">
                            <span class="plus"></span>
                        </div>
                    </div>
                </td>
                <td class="cart-total" >
                    <p id="orderdetail-price">${SYMBOL_CURRENCY}${order_detail.price}</p>
                </td>
                <td class="cart-close">
                    <button onclick="CART_OBJECT.delete_orderdetail('${order_detail.id}')"><i class="fa fa-times"></i></button>
                </td>
            </tr>
        `
        return node
    }

    get_node_element_address(address) {
        let node_free = `
            <span class="free-lable">Free</span>
        `
        let node = `
               <div class="address-item" id="address-${address.id}"> 
                    <label for="address-input-${address.id}">
                        <p>${address.address}</p>
                        <input type="radio" name="address" value="${address.id}" cost="${address.cost}" class="address-input" id="address-input-${address.id}">
                        ${address.is_free == true ? node_free : ''}
                        <div class="check">
                          <div class="inside"></div>
                        </div>
                    </label>
               </div>
        `
        return node
    }

    get_info = function () {
        let This = this
        let url = this.URL('user/cart/get')
        this.SEND_AJAX(url, {}, {
            error_message: false, auth: true, login_redirect: true, response: function (response) {
                let status = response.status
                if (status == 200) {
                    This.set_info(response)
                } else if (status == 401) {
                    This.COUNTER_TRY_GET_USER_CART -= 1
                    if (This.COUNTER_TRY_GET_USER_CART > 0) {
                        This.get_info()
                    }
                }
            }
        })
    }

    create_orderdetails(order) {
        let This = this
        for (let order_detail of order.details) {
            this.container_order_details.innerHTML += this.get_node_element_orderdetail(order_detail)
        }

        $(".num-in span").on("click", function () {
            var $input = $(this).parents('.num-block').find('input.in-num');
            if ($(this).hasClass('minus')) {
                var count = parseFloat($input.val()) - 1;
                count = count < 1 ? 1 : count;
                if (count < 2) {
                    $(this).addClass('dis');
                } else {
                    $(this).removeClass('dis');
                }
                $input.val(count);
            } else {
                var count = parseFloat($input.val()) + 1
                $input.val(count);
                if (count > 1) {
                    $(this).parents('.num-block').find(('.minus')).removeClass('dis');
                }
            }

            $input.change();
            This.event_input_quantity($input)
            return false;
        });
    }

    create_addresses(addresses) {
        let This = this

        function unselect_all_address() {
            for (let address_input of addresses_input) {
                address_input.parentNode.parentNode.classList.remove('address-item-selected')
            }
        }

        function select_address(input) {
            input.parentNode.parentNode.classList.add('address-item-selected')
            let cost = input.getAttribute('cost')
            let id = input.getAttribute('value')
            cost = Math.round(cost * 100) / 100;
            let price_order = Math.round(This.ORDER.price * 100) / 100;
            This.ADDRESS = {
                'id': id,
                'cost': cost
            }
            if (cost != 0) {
                This.cost_shipping.innerText = `${SYMBOL_CURRENCY} ${cost.toFixed(2)}`

                This.set_price_order()
                // This.container_total.innerText = `${SYMBOL_CURRENCY} ${(price_order + cost).toFixed(2)}`
            } else {
                This.cost_shipping.innerHTML = `
                    <p class="free">Free</p>
                `
                This.set_price_order()
            }

        }

        for (let address of addresses) {
            this.container_address.innerHTML += this.get_node_element_address(address)
        }

        let addresses_input = document.querySelectorAll('.address-input')
        for (let address_input of addresses_input) {
            address_input.addEventListener('change', function (e) {
                unselect_all_address()
                This.ID_ADDRESS = this.getAttribute('value')
                select_address(this)
            })
        }

        if (addresses.length != 0) {
            // Select Default address
            document.querySelector('.address-input').click()
        } else {
            this.container_address.classList.add('d-none')
            this.container_address_notfound.classList.remove('d-none')
            this.btn_add_address.classList.add('btn-add_address-active')
        }

    }

    set_info = function (response) {
        let _data = response.data
        let order = _data.order
        let user = _data.user
        let addresses = user.address
        this.ORDER = order
        if (order.is_not_empty == false) {
            document.getElementById('order-is-empty').classList.remove('d-none')
            document.getElementById('container').remove()
        } else {
            this.create_orderdetails(order)
            this.create_addresses(addresses)
            this.set_price_order()
        }
    }

    set_price_order() {
        let cost_address = this.ADDRESS.cost
        let order = this.ORDER
        let subtotal = parseFloat(order.price)
        let total = parseFloat(order.price)
        this.container_total.innerText = `${SYMBOL_CURRENCY}${(total + cost_address).toFixed(2)}`
        this.container_subtotal.innerText = `${SYMBOL_CURRENCY}${subtotal.toFixed(2)}`
        this.container_subtotal_without_discount.innerText = `${SYMBOL_CURRENCY}${order.price_without_discount}`
    }

    delete_orderdetail = function (id) {
        let This = this
        let url = this.URL('user/cart/orderdetail/delete')
        let orderdetail_element = document.getElementById(`orderdetail-${id}`)
        this.SEND_AJAX(url, {
            'id': id
        }, {
            auth: true,
            error_redirect: false,
            loading_section: orderdetail_element,
            response: function (response) {
                orderdetail_element.remove()
                if (response.success) {
                    let data = response.data
                    This.ORDER = data.order
                    This.set_price_order()
                    let allDetails = document.querySelectorAll('.shop-cart-item')
                    if (allDetails.length == 0) {
                        location.reload()
                    }
                }
            }
        })
    }

    delete_all_orderdetail = function () {
        let url = this.URL('user/cart/orderdetail/delete-all')
        this.SEND_AJAX(url, {}, {
            auth: true,
            error_redirect: false,
            loading_section: document.getElementById('cart_box'),
            response: function (response) {
                if (response.status) {
                    location.reload()
                }
            }
        })
    }

    event_input_quantity = function (input) {
        event_input_quantity(input)
        let This = CART_OBJECT
        let parent_input = input[0].parentNode
        let value = input.val()
        let id = input.attr('orderdetail-id')
        let url = This.URL('user/cart/orderdetail/changecount')
        parent_input.classList.add('loading-section-small')
        This.SEND_AJAX(url, {
            'id': id,
            'count': value
        }, {
            auth: true,
            login_redirect: true,
            error_redirect: false,
            loading_section: parent_input,
            response: function (response) {
                let data = response.data
                let order = data.order
                This.ORDER = order
                let orderdetail_element = document.getElementById(`orderdetail-${data.id}`)
                input.val(data.count)
                orderdetail_element.querySelector('#orderdetail-price').innerText = `${SYMBOL_CURRENCY}${data.price_detail}`
                This.set_price_order()
            }
        })
    }
}

class Dashboard extends PIZZLE {
    constructor() {
        super();
        new Header('dashboard')
        new SubscribeNews()
        new Footer()
        this.COUNTER_TRY_GET_INFO = 2
        this.get_info()
    }

    get_info = function () {
        let This = this
        let url = this.URL('user/get-dashboard')
        this.SEND_AJAX(url, {}, {
            auth: true,
            login_redirect: true,
            error_redirect: true,
            error_message: false,
            response: function (response) {
                let status = response.status
                if (status == 200) {
                    This.set_info(response.data)
                }
                This.COUNTER_TRY_GET_INFO -= 1
                if (status == 401 && This.COUNTER_TRY_GET_INFO > 0) {
                    This.get_info()
                }
            }
        })
    }

    set_info = function (data) {
        let This = this

        this.input_name = document.getElementById('InputName')
        this.input_family = document.getElementById('InputFamily')
        this.input_phonenumber = document.getElementById('InputPhoneNumber')
        this.input_email = document.getElementById('InputEmail')
        this.input_email.disabled = true

        let container_visits = document.querySelector('.last-visits > div')
        let container_orders = document.querySelector('#container-orders .article-content')
        let container_address = document.querySelector('#container-address .article-content')
        let container_add_address = document.querySelector('#container-add-address')
        let container_comments = document.querySelector('#container-comments .article-content')
        let container_notifications = document.querySelector('#container-notifications .article-content')

        let btn_add_address = document.getElementById('btn-add-address')
        let btn_submit_address = document.getElementById('btn-submit-address')


        let full_name = document.getElementById('full-name')
        let order_count = document.getElementById('order-count')


        let user = data.user
        let orders = data.orders
        let addresses = data.address
        let comments = data.comments
        let lastvisits = data.lastvisits
        let notifications = data.notifications

        full_name.innerText = user.full_name
        order_count.innerText = orders.length


        if (orders.length == 0) {
            document.querySelector('.main-item-order').insertAdjacentHTML('beforeend', `
                <a href="foods.html" class="cta_btn small_btn mt-1">Order Now</a>
            `)
        }


        // Last Visits
        for (let lastvisit of lastvisits) {
            let meal = lastvisit.meal
            let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', meal.slug])
            let node = `
                <div class="last-visit">
                    <div>
                        <a href="${slug}">
                            <img src="${meal.image}" alt="${meal.title}">
                            ${meal.title}
                        </a>
                    </div>
                    <div class="last-visit-time">
                        <p>${lastvisit.time_past}</p>
                        <i class="fa fa-clock AnimationRotateClock"></i>
                    </div>
                </div>
            `
            container_visits.innerHTML += node
        }
        if (lastvisits.length == 0) {
            container_visits.innerHTML = `
                <div class="not-found">
                    <p>Not found last visit</p>
                     <a href="foods.html"  class="text-light fs-5">visit now</a>
                </div>
            `
        }

        // Orders
        let _counter_orders_loop = 0
        for (let order of orders) {
            _counter_orders_loop++

            let node_status = ``
            let node_details = ``

            if (order.status == 'preparation') {
                node_status = `
                    <p class="field-result order-status-preparation">
                            ${order.status}
                    </p>
                `
            } else if (order.status == 'sending') {
                node_status = `
                    <p class="field-result order-status-sending">
                            ${order.status}
                    </p>
                `
            } else if (order.status == 'delivered') {
                node_status = `
                    <p class="field-result order-status-delivered">
                            ${order.status}
                    </p>
                `
            }

            for (let detail of order.details) {
                node_details += this.GET_HTML_ELEMENT_MEALDETAIL(detail)
            }

            let node = `
                <div class="order-item">
                    <div class="collapse-toggle d-flex justify-content-between align-items-center">
                        <div>
                            <div class="field">
                                <p class="field-title">
                                    #
                                </p>
                                <p class="field-result">
                                    ${_counter_orders_loop}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    count
                                </p>
                                <p class="field-result">
                                    ${order.details.length}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    time
                                </p>
                                <p class="field-result">
                                    ${order.time_paid}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    price
                                </p>
                                <p class="field-result">
                                    ${SYMBOL_CURRENCY}${order.price}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    address
                                </p>
                                <p class="field-result">
                                    ${order.address ? order.address.address_short : '-'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div class="field">
                                <p class="field-title">
                                    status
                                </p>
                                ${node_status}
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    more
                                </p>
                                <p class="field-result">
                                    <button data-toggle="collapse" data-target="#order-item-${_counter_orders_loop}">
                                        <i class="fa fa-ellipsis-h"></i>
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="order-item-more collapse" id="order-item-${_counter_orders_loop}">
                        <div class="field-lg">
                            <h6>Details :</h6>
                            <div>
                                ${node_details}
                            </div>
                        </div>
                        <div class="field-lg">
                            <h6>Address :</h6>
                            <div>
                                 ${order.address ? order.address.address : ''} - ${order.address ? order.address.postal_code : ''}
                            </div>
                        </div>
                        <div class="field-lg">
                            <h6>Description :</h6>
                            <div>
                                ${order.description ? order.description : 'Without description'}
                            </div>
                        </div>
                    </div>
                </div>
            `
            container_orders.innerHTML += node
        }


        // Address
        this._counter_address_loop = 0
        for (let address of addresses) {
            this._counter_address_loop++
            let node = this.get_html_element_address(address, this._counter_address_loop)
            container_address.innerHTML += node
        }

        if (addresses.length == 0) {
            container_address.insertAdjacentHTML('beforebegin', `
              <div class="not-found" style="margin-top: 50px;border-bottom: 1px solid #eee; padding-bottom: 70px;">
                  <h4>not found address</h4>
              </div>
            `)
            btn_add_address.classList.add('d-none')
            container_add_address.classList.add('show')
        }


        // Comments
        for (let comment of comments) {
            let node = this.get_html_element_comment(comment)
            container_comments.innerHTML += node
        }
        if (comments.length == 0) {
            container_comments.innerHTML = `
                <div class="not-found">
                    <h2>Not found comment</h2>
                    <p class="text-light fs-6">Share your comment about one of our food</p>
                    <a href="${PAGE_MEALS}" class="cta_btn mx-auto mt-3" style="width: 200px;color: white">
                        Foods
                        <i class="fa fa-pizza-slice"></i>
                    </a>
                </div>
            `
        }


        // Notifications
        for (let notification of notifications) {
            let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', notification.meal.slug])
            let node = `
                <div class="notification" id="notification-${notification.id}">
                    <div>
                        <img src="${notification.meal.image}" alt="${notification.meal.title}"  title="${notification.meal.title}" onclick="GoToUrl('${slug}')">
                        <a href="${slug}">${notification.meal.title_short}</a>
                    </div>
                    <div>
                        <button class="btn-default" onclick="DASHBOARD.delete_notification('${notification.meal.slug}','${notification.id}')">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `
            container_notifications.innerHTML += node
        }

        if (notifications.length == 0) {
            container_notifications.innerHTML = `
                <div class="not-found" style="margin-top: 120px;">
                    <h3>Not found notification</h3>
                </div>
            `
        }

        // Information
        this.input_name.value = user.name
        this.input_family.value = user.family
        this.input_phonenumber.value = user.phone_number || ''
        this.input_email.value = user.email


        active_collapses()
        CheckInputValInit()

    }

    submit_information = function () {
        let url = this.URL('user/info/edit')
        this.SEND_AJAX(url, {
            'name': this.input_name.value,
            'family': this.input_family.value,
            'phonenumber': this.input_phonenumber.value,
        }, {
            auth: true,
            login_redirect: true,
            error_redirect: true,
            error_message: true,
            loading_section: document.querySelector('#container-information .article-content'),
            response: function (response) {
                if (response.success) {
                    ShowNotificationMessage(response.message, 'Success')
                }
            }
        })
    }

    add_address = function () {
        let This = this
        let container_address = document.querySelector('#container-address .article-content')
        let container_add_address = document.querySelector('#container-add-address')
        let input_postalcode = document.getElementById('PostalCodeAdd')
        let input_address = document.getElementById('AddressAdd')
        let postal_code_valid = input_postalcode.getAttribute('valid') || 'false'
        let address_valid = input_address.getAttribute('valid') || 'false'
        if (postal_code_valid == 'true' && address_valid == 'true') {
            let url = this.URL('user/address/add')
            this.SEND_AJAX(url, {
                'address': input_address.value,
                'postalcode': input_postalcode.value
            }, {
                auth: true,
                loading_section: container_add_address,
                error_redirect: false,
                error_message: true,
                response: function (response) {
                    if (response.success) {
                        This._counter_address_loop++
                        let address = response.data.address
                        let node = This.get_html_element_address(address, This._counter_address_loop)
                        container_address.innerHTML += node
                        ShowNotificationMessage(response.message, 'Success')
                        // Hide collapse add address
                        active_collapses()
                        document.querySelector('#container-add-address').classList.remove('show')
                        CheckInputValInit()
                    }
                }
            })
        } else {
            ShowNotificationMessage('Please enter the fields correctly', 'Error')
        }

    }

    get_html_element_address = function (address, _counter_address_loop) {
        let node_cost = ``
        if (address.cost == 0) {
            node_cost = `
                    <p class="free-lable">Free</p>
                `
        } else {
            node_cost = `
                    ${SYMBOL_CURRENCY}${address.cost}
                `
        }
        let node = `
                <div class="address-item" id="address-item-${address.id}" counter-loop="${_counter_address_loop}">
                    <div class="collapse-toggle d-flex justify-content-between align-items-center">
                        <div>
                            <div class="field">
                                <p class="field-title">
                                    #
                                </p>
                                <p class="field-result">
                                    ${_counter_address_loop}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    postal code
                                </p>
                                <p class="field-result">
                                    ${address.postal_code}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    address
                                </p>
                                <p class="field-result">
                                    ${address.address_short}
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    cost
                                </p>
                                <p class="field-result">
                                    ${node_cost}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div class="field">
                                <p class="field-title">
                                    Edit
                                </p>
                                <p class="field-result">
                                    <button onclick="show_collapse(this)" data-target="#address-collapse-${address.id}">
                                        <i class="fa fa-edit"></i>
                                    </button>
                                </p>
                            </div>
                            <div class="field">
                                <p class="field-title">
                                    Delete
                                </p>
                                <p class="field-result">
                                    <button onclick="DASHBOARD.delete_address('${address.id}')">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="address-item-edit collapse" id="address-collapse-${address.id}">
                        <div class="col-12 col-lg-7 mx-auto">
                            <div>
                                <label for="#PostalCode-${address.id}">
                                    Postal Code :
                                </label>
                                <input type="number" id="PostalCode-${address.id}" value="${address.postal_code}" CheckInputVal Bigger="3" Less="15" TypeVal="Number" oninput="CheckInputValidations(this,3,15,'Input','Number')">
                            </div>
                            <div>
                                <label for="#Address-${address.id}">
                                    Address :
                                </label>
                                <textarea type="text" id="Address-${address.id}" CheckInputVal Bigger="3" Less="200" oninput="CheckInputValidations(this,3,200,'Input','Text')" >${address.address}</textarea>
                            </div>
                            <div class="select-address-map">
                                <button class="btn-submit" onclick="DASHBOARD.change_address('${address.id}')">Edit</button>
                            </div>
                        </div>
                    </div>
                </div>`
        return node
    }

    get_html_element_comment = function (comment) {
        let slug = this.URL_TEMPLATE(PAGE_MEAL_DETAIL, ['slug', comment.meal.slug])
        let node_is_checked = ``

        if (comment.is_checked) {
            node_is_checked = `
                <i class="fa fa-check-circle" title="published"></i>
            `
        } else {
            node_is_checked = `
                <i class="fa fa-clock" title="checking..."></i>
            `
        }

        let node = `
            <div class="single-comment-box" id="comment-${comment.id}">
                 <div class="main-comment">
                    <div class="author-image">
                        <img src="${comment.meal.cover_image}" alt="${comment.meal.title}" title="${comment.meal.title_short}" onclick="GoToUrl('${slug}')">
                    </div>
                    <div class="comment-text">
                        <div class="comment-info">
                            <div>
                                <h4>
                                    <a href="${slug}">${comment.meal.title_short}</a>
                                </h4>
                                <div class="ratings-container d-inline-block text-center mx-2 w-auto">
                                    <div class="ratings">
                                        <div class="ratings-val" id="rating-val" style="width: ${parseFloat(comment.rate) * 20}%"></div>
                                    </div>
                                </div>
                                <p>${comment.time_send}</p>
                            </div>
                            <div>
                                <span class="d-inline-block" style="margin-right: 7px;">${node_is_checked}</span>
                                <button class="btn-delete-comment" onclick="DASHBOARD.delete_comment('${comment.id}')">
                                      <i class="fa fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="comment-text-inner">
                            <p>${comment.text}</p>
                        </div>
                    </div>
                </div>
            </div>
        `

        return node
    }

    delete_notification = function (slug, id) {
        let element_notification = document.getElementById(`notification-${id}`)
        let url = this.URL('food/notify')
        this.SEND_AJAX(url, {
                'slug': slug
            },
            {
                error_message: false,
                auth: true,
                login_redirect: true,
                loading_section: element_notification,
                response: function (response) {
                    if (response.success) {
                        element_notification.remove()
                        ShowNotificationMessage('Your notification deleted successfully', 'Success')
                    }
                }
            }
        )
    }

    delete_comment = function (id) {
        let element_comment = document.querySelector(`#comment-${id}`)
        let url = this.URL('food/comment/delete')
        this.SEND_AJAX(url, {
            'comment_id': id
        }, {
            auth: true,
            error_message: true,
            error_redirect: false,
            loading_section: element_comment,
            response: function (response) {
                if (response.success) {
                    element_comment.remove()
                    ShowNotificationMessage(response.message, 'Success')
                }
            }
        })
    }

    delete_address = function (id) {
        let element_address = document.getElementById(`address-item-${id}`)
        let url = this.URL('user/address/delete')
        this.SEND_AJAX(url, {
            'address_id': id
        }, {
            auth: true,
            error_message: true,
            login_redirect: true,
            error_redirect: false,
            loading_section: element_address,
            response: function (response) {
                if (response.success) {
                    element_address.remove()
                    ShowNotificationMessage(response.message, 'Success')
                }
            }
        })
    }

    change_address = function (id) {
        let This = this
        let element_address = document.getElementById(`address-item-${id}`)
        let input_postalcode = document.getElementById(`PostalCode-${id}`)
        let input_address = document.getElementById(`Address-${id}`)
        let postal_code_valid = input_postalcode.getAttribute('valid') || 'false'
        let address_valid = input_address.getAttribute('valid') || 'false'
        let url = this.URL('user/address/edit')
        if (postal_code_valid == 'true' && address_valid == 'true') {
            this.SEND_AJAX(url, {
                'address_id': id,
                'address': input_address.value,
                'postalcode': input_postalcode.value
            }, {
                auth: true,
                error_message: true,
                login_redirect: true,
                error_redirect: false,
                loading_section: element_address,
                response: function (response) {
                    if (response.success) {
                        let address = response.data.address
                        let _counter_address = element_address.getAttribute('counter-loop')
                        let node = This.get_html_element_address(address, _counter_address)
                        element_address.outerHTML = node
                        ShowNotificationMessage(response.message, 'Success')
                        active_collapses(element_address.querySelector('[data-toggle="collapse"]'))
                        CheckInputValInit()
                    }
                }
            })
        } else {
            ShowNotificationMessage('Please enter the fields correctly', 'Error')
        }
    }


}

class AboutUs extends PIZZLE {
    constructor() {
        super()
        this.get_info()
        new Header('aboutus')
        new SubscribeNews()
        new Footer()
    }

    get_info = function () {
        let url = this.URL('aboutus/get')
        this.SEND_AJAX(url, {}, {
            error_redirect: true,
            response: function (response) {
                if (response.success) {
                    document.getElementById('why-cooseus').querySelector('.content').innerHTML = response.data.why_chooseus
                    document.getElementById('story-aboutus').querySelector('.content').innerHTML = response.data.why_chooseus
                }
            }
        })
    }
}

class ContactUs extends PIZZLE {
    constructor() {
        super()
        this.get_info()
        new Header('contactus')
        new SubscribeNews()
        new Footer()
    }

    get_info = function () {
        let url = this.URL('contactus/get')
        this.SEND_AJAX(url, {}, {
            error_redirect: true,
            error_message: true,
            response: function (response) {
                if (response.success) {
                    let data = response.data
                    let container_email = document.getElementById('container-email')
                    let container_phone = document.getElementById('container-phone')
                    let container_location = document.getElementById('container-location')
                    let location_image = document.getElementById('location-image')

                    // Email
                    for (let email of data.emails) {
                        container_email.innerHTML += `
                            <p>${email.email}</p>
                        `
                    }
                    // Phone
                    for (let phone of data.phones) {
                        container_phone.innerHTML += `
                            <p>${phone.phone}</p>
                        `
                    }
                    // Location
                    for (let location of data.locations) {
                        container_location.innerHTML += `
                            <p>${location.location}</p>
                        `
                    }

                    location_image.src = data.location_image
                }
            }
        })
    }

    send_feedback = function () {
        let email = document.getElementById('email')
        let name = document.getElementById('name')
        let subject = document.getElementById('sub')
        let message = document.getElementById('textarea')

        let email_valid = email.getAttribute('valid') || 'false'
        let name_valid = name.getAttribute('valid') || 'false'
        let subject_valid = subject.getAttribute('valid') || 'false'
        let message_valid = message.getAttribute('valid') || 'false'

        let container_form = document.getElementById('contact-form')

        if (email_valid == 'true' && name_valid == 'true' && subject_valid == 'true' && message_valid == 'true') {
            let url = this.URL('contactus/feedback/submit')
            this.SEND_AJAX(url, {
                'name': name.value,
                'email': email.value,
                'subject': subject.value,
                'message': message.value
            }, {
                error_message: true,
                error_redirect: true,
                loading_section: container_form,
                response: function (response) {
                    if (response.success) {
                        ShowNotificationMessage(response.message, 'Success')
                        container_form.remove()
                    }
                }
            })
        } else {
            ShowNotificationMessage('Please enter fields correctly', 'Error')
        }
    }
}

class Header extends PIZZLE {
    constructor(type_page,get_user=true) {
        super(get_user)
        this.TYPE = type_page
        this.set_node(this.USER)
    }

    set_node = function (user) {
        let node_login = ``
        let node_cart = ``

        if (!user) {
            node_login = `
                 <li class="d-none d-lg-inline-block">
                     <a href="login.html">Login</a>
                 </li>
                 <li class="d-lg-none">
                    <a href="login.html">
                        <i class="fa fa-sign-in-alt">
                        </i>
                    </a>
                 </li>
            `
        } else {
            node_login = `
                <li class="d-none d-lg-inline-block">
                    <a href="dashboard.html">
                        <i class="far fa-user">
                        </i>
                    </a>
                 </li>
            `
            node_cart = `
                <li>
                    <a class="cart_count" href="cart.html">
                        <img src="${this.TYPE == 'home' ? 'assets/img/shopping-bag.svg' : 'assets/img/shopping-bag-black.svg'}" alt="shopping bag">
                        <span>${user.order_count_meal}</span>
                    </a>
                 </li>
            `
        }


        let node = `

                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="header_inn d-flex align-items-center justify-content-between">
                                <div class="header_left">
                                    <div class="site_logo">
                                        <a href="index.html"><img src="${this.TYPE == 'home' ? 'assets/img/logo.png' : 'assets/img/logo_black.png'}" alt="logo"></a>
                                    </div>
                                    <div class="mainmenu">
                                        <nav id="menu">
                                            <ul class="dropdown">
                                                <li  type="home"><a href="index.html">Home</a></li>
                                                <li class="has-submenu">
                                                    <a href="javascript:;">Shop</a>
                                                    <ul class="sub-menu">
                                                        <li type="foods"><a href="foods.html">Foods</a></li>
                                                        <li type="cart"><a href="cart.html">Cart</a></li>
                                                    </ul>
                                                </li>
                                                <li type="gallery"><a href="gallery.html">Gallery</a></li>
                                                <li type="aboutus"><a href="about.html">About Us</a></li>
                                                <li type="contact"><a href="contact.html">Contact</a></li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
                                <div class="header_right">
                                    <ul class="header_tools">
                                        ${node_login}
                                        ${node_cart}
                                    </ul>
                                    <div class="spinner-master">
                                        <div id="spinner-form" class="spinner-spin">
                                            <div class="spinner diagonal part-1"></div>
                                            <div class="spinner horizontal"></div>
                                            <div class="spinner diagonal part-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

        `
        document.querySelector('.header_area').innerHTML = node
        try {
            document.getElementById('menu').querySelector(`[type="${this.TYPE}"]`).classList.add('active')
        } catch (e) {

        }
    }
}

class Footer extends PIZZLE {
    constructor() {
        super()
        this.set_node()
    }

    set_node = function () {
        let node = `
      
                <div class="footer_top">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-md-12 col-lg-12 d-lg-none">
                                <div class="footer_widget">
                                    <div class="logo_footer">
                                        <img src="assets/img/footer_logo.png" alt="img">
                                    </div>
                                    <div class="footer_desc">
                                        <p>44 Canal Center Plaza #200, Alexandria, VA 22314, USA</p>
                                        <p>Hotline : <span>1900 – 123 456 78</span></p>
                                        <p>Email: <span>info@example.com</span></p>
                                    </div>
                                    <div class="footer_socials">
                                        <div class="content_socials">
                                            <ul class="socials_list">
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-facebook-f"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-instagram"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-twitter"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-pinterest-p"></i>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3">
                                <div class="footer_widget">
                                    <div class="footer_listitem">
                                        <div class="listitem_inner">
                                            <h4 class="footer_title">Customer </h4>
                                            <ul class="listitem_list">
                                                <li>
                                                    <a href="dashboard.html">
                                                        Dashboard
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="cart.html">
                                                        Cart
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="gallery.html">
                                                        Gallery
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="index.html">
                                                        Home
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 d-none d-lg-block">
                                <div class="footer_widget">
                                    <div class="logo_footer">
                                        <img src="assets/img/footer_logo.png" alt="img">
                                    </div>
                                    <div class="footer_desc">
                                        <p>44 Canal Center Plaza #200, Alexandria<br> VA 22314, USA</p>
                                        <p>Hotline : <span>1900 – 123 456 78</span></p>
                                        <p>Email: <span>info.foodshop@gmail.com</span></p>
                                    </div>
                                    <div class="footer_socials">
                                        <div class="content_socials">
                                            <ul class="socials_list">
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-facebook-f"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-instagram"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-twitter"></i>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:;">
                                                        <i class="fab fa-pinterest-p"></i>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3">
                                <div class="footer_widget ">
                                    <div class="footer_listitem">
                                        <div class="listitem_inner">
                                            <h4 class="footer_title">
                                                Opening Hour
                                            </h4>
                                            <ul class="open_hours">
                                                <li><span>Mon - Fri:</span> <span>09:00 – 23:00h</span></li>
                                                <li><span>Saturday:</span> <span>09:00 – 16:00h</span></li>
                                                <li><span>Sunday:</span> <span>12:00 – 18:00h</span></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer_bottom">
                    <div class="container">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="copyright">
                                    <p>&copy;  2022 - <a href="https://fazelmomeni.codevar.ir" style="color: #ff9c1d;font-weight: bold">Fazel Momeni</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
  
        `
        document.querySelector('.footer_area').innerHTML = node
    }
}

class SubscribeNews extends PIZZLE {
    constructor() {
        super()
        this.set_node()
    }

    set_node = function () {
        let This = this
        let node = `
                <img src="assets/img/shape_10.png" alt="shape" class="shape_10">
                <img src="assets/img/shape_11.png" alt="shape" class="shape_11">
                <img src="assets/img/shape_12.png" alt="shape" class="shape_12">
                <img src="assets/img/shape_13.png" alt="shape" class="shape_13">
                <img src="assets/img/shape_14.png" alt="shape" class="shape_14">
                <img src="assets/img/shape_15.png" alt="shape" class="shape_15">
                <img src="assets/img/shape_16.png" alt="shape" class="shape_16">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="subscribe_inn">
                                <div class="site_heading">
                                    <h3 class="sub_title">Don’t miss</h3>
                                    <h2 class="section_title">Subscribe To Newsletter</h2>
                                </div>
                                <div class="subscribe_box">
                                    <form>
                                        <input type="email" id="input-subs-news" placeholder="Enter your E-mail"/>
                                        <button type="button" onclick="PIZZLE_OBJECT.subscribe_unsubscribe()">Subscribe</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        `
        document.querySelector('.subscribe_area').innerHTML = node
    }

}


// Banner-DJ


const BACKEND_URL_BANNER_DJ = URL_DOMAIN_BACKEND 
const SIZE_SMALL_SCREEN_BANNERDJ = 768
let media_query_smallsize_banner = window.matchMedia(`(max-width: ${SIZE_SMALL_SCREEN_BANNERDJ}px)`)
chanageSizeWindowQueryBanner(media_query_smallsize_banner)
media_query_smallsize_banner.addListener(chanageSizeWindowQueryBanner)



function GetBannerDJListHide() {
    return _GetCookieByName('banner-dj-list-hide')
}

function _Banner_dj_init() {
    function can_show(banner_id) {
        let list_banner_id_hide = GetBannerDJListHide() || "[]"
        list_banner_id_hide = JSON.parse(list_banner_id_hide)
        if (list_banner_id_hide.includes(String(banner_id))) {
            return false
        }
        return true
    }


    let data = {
        'url': window.location.pathname
    }
    fetch(`${BACKEND_URL_BANNER_DJ}/banner-dj`, {
        method: 'POST',
        body: JSON.stringify(data)
    }).then(function (response) {
        return response.json()
    }).then(function (response) {
        let status = response.status
        let banners = response.banners
        if (status == 200) {
            for (let banner of banners) {
                if (can_show(banner.id)) {
                    CREATE_BANNER_DJ(banner)
                }
            }
            chanageSizeWindowQueryBanner(chanageSizeWindowQueryBanner)
        }
    })

}

_Banner_dj_init()


function CREATE_BANNER_DJ(banner) {
    let banner_element = document.createElement('div')

    let style_top = ``
    let style_bottom = ``
    let style_left = ``
    let style_right = ``
    let style_translate_x = '0'
    let style_translate_y = '0'

    let align_vertical = banner.style.align_vertical
    let align_horizontal = banner.style.align_horizontal


    if (align_horizontal == 'top') {
        style_top = '0'
    } else if (align_horizontal == 'middle') {
        style_top = '50%'
        style_translate_y = '-50%'
    } else if (align_horizontal == 'bottom') {
        style_bottom = '0'
    }

    if (align_vertical == 'right') {
        style_right = '0'
    } else if (align_vertical == 'center') {
        style_right = '50%'
        style_translate_x = '50%'
    } else if (align_vertical == 'left') {
        style_left = '0'
    }

    let style = `
        width:${banner.style.width};
        height:${banner.style.height};
        top:${style_top};
        bottom:${style_bottom};
        left:${style_left};
        right:${style_right};
        transform:translate(${style_translate_x},${style_translate_y})
    `

    let style_image = `
        object-fit:${banner.style.image_fit};
    `

    banner_element.setAttribute('width-smallsize', banner.style.width_smallsize)
    banner_element.setAttribute('height-smallsize', banner.style.height_smallsize)


    banner_element.style = style
    banner_element.setAttribute('style-init', style)
    banner_element.id = `banner-id-${banner.id}`
    banner_element.classList.add('banner-dj-el')
    banner_element.innerHTML = `
        <div>
            <button title="close" onclick="HideBannerDJ('${banner.id}')">
                <i class="fa fa-minus"></i>
            </button>
            <img src="${banner.image}" alt="${banner.name}" title="${banner.name}" onclick="GoToUrlBanner('${banner.id}')" banner-id="${banner.id}" style="${style_image}">
            <a href="${banner.href}" target="_blank" hidden></a>
        </div>
    `

    document.body.appendChild(banner_element)
}

function GoToUrlBanner(banner_id) {
    fetch(`${BACKEND_URL_BANNER_DJ}/banner-dj/click`, {
        method: 'POST',
        body: JSON.stringify({'banner_id': banner_id}),
    }).then(function (response) {
        return response.json()
    }).then(function (response) {
        document.querySelector(`#banner-id-${banner_id}`).querySelector('a').click()
    })
}

function HideBannerDJ(banner_id) {
    let ids = GetBannerDJListHide() || "[]"
    ids = JSON.parse(ids)
    ids.push(banner_id)
    ids = JSON.stringify(ids)
    _SetCookie('banner-dj-list-hide', ids)
    // Hide
    document.querySelector(`#banner-id-${banner_id}`).classList.add('animation-class-hide-banner-dj')
}


function _GetCookieByName(Name) {
    let Res = null
    let Cookie = document.cookie
    for (let i of Cookie.split(';')) {
        let S1 = i.split('=')[0]
        let S2 = i.split('=')[1]
        if (S1 == Name || S1 == ` ${Name}` || S1 == `${Name} `) {
            Res = S2
        }
    }
    return Res
}

function _SetCookie(Name, Value, ExpireDay = 30, Path = '/') {
    let T = new Date()
    T.setTime(T.getTime() + (ExpireDay * 24 * 60 * 60 * 1000))
    T = T.toUTCString()
    if (ExpireDay == 'Session') {
        T = ''
    }
    document.cookie = `${Name}=${Value};expires=${T};path=${Path}`
}

function chanageSizeWindowQueryBanner(x) {
    let allBanner = document.querySelectorAll('.banner-dj-el')
    if (x.matches || window.outerWidth < SIZE_SMALL_SCREEN_BANNERDJ) {
        for (let banner of allBanner) {
            banner.style.width = banner.getAttribute('width-smallsize')
            banner.style.height = banner.getAttribute('height-smallsize')
        }
    } else {
        for (let banner of allBanner) {
            banner.style = banner.getAttribute('style-init')
        }
    }
}
























function ScrollOnElement(ID_Element, Element = null) {
    if (ID_Element == null) {
        try {
            window.scrollTo(0, Element.scrollTop)
        } catch (e) {
        }
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
    setTimeout(function () {
        ContainerMessage.remove()
    }, Timer)

    BtnClose.onclick = function () {
        ContainerMessage.remove()
    }
}

function RemoveAllNotifications() {
    try {
        document.getElementsByClassName('NotificationMessage')[0].remove()
        document.getElementsByClassName('NotificationMessage')[1].remove()
    } catch (e) {
    }
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
    if (SetIn == 'None'){
        Input.setAttribute('Valid-Style','no-effect')
    }
    return State
}


//////////////////////////////////                  Scroll          ///////////////////////////////////////////////

let HeightWindowBaseTemplate = window.innerHeight
window.onscroll = function () {
    try {
        if (window.scrollY > HeightWindowBaseTemplate) {
            document.getElementById('ButtonGoToTopPage').classList.add('ButtonGoToTopIsShow')
        } else {
            document.getElementById('ButtonGoToTopPage').classList.remove('ButtonGoToTopIsShow')
        }
    } catch (e) {
    }
}

//////////////////////////////////                Functionality Cookie         ///////////////////////////////////////////////
function SetCookieFunctionality_ShowNotification(Text, Type, Timer = 5000, LevelOfNecessity = 2) {
    document.cookie = `Functionality_N=${Text}~${Type}~${Timer}~${LevelOfNecessity};path=/`
}


function GetCookieFunctionality_ShowNotification() {
    setTimeout(function () {
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
        } catch (e) {
        }
        if (Cookie_Key == 'Functionality_N' || Cookie_Key == ' Functionality_N' || Cookie_Key == ' Functionality_N ') {
            // let TextResult = ConvertCharEnglishToPersianDecode(Text)
            let TextResult = Text
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
        } catch (e) {
            Res += i
        }
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
    List.filter(function (e) {
        if (e == Value) {
            State = true
        }
    })
    return State
}

////////////////////////////////////  Replace With Index  ///////////////////////////////////////////////
String.prototype.ReplaceWithIndex = function (StartIndex, EndIndex, NewStr) {
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
    document.addEventListener('click', ClickOutSideCnt = function (event) {
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
    document.addEventListener('click', ClickInSideOrNot = function (event) {
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
function SignOutAccount() {
    SetCookie('refresh-user', '', 0)
    SetCookie('access-user', '', 0)
    window.location.href = PAGE_HOME
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
        let OnTouchEndF = arguments.OnTouchEnd || function () {
        }
        let OnTouchStartF = arguments.OnTouchStart || function () {
        }
        Element.classList.add('MenuIsClose')
        Element.ontouchstart = function (e) {
            if (Element.getAttribute('StateOnTouchStart') == 'true') {
                OnTouchStartF(e)
                Element.setAttribute('StateOnTouchStart', 'false')
                Element.classList.remove('MenuIsOpen')
                Element.classList.remove('MenuIsClose')
            }
        }
        Element.ontouchmove = function (e) {
            if (Element == e.target) {
                SetTouchIncreaseWidthElement(Element, e, Direction, Max, Min)
                Element.setAttribute('StateOnTouchStart', 'true')
                Element.style.transition = 'all 0s'
            }
        }
        Element.ontouchend = function (e) {
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
        Element.ontouchmove = function (e) {
            if (Element == e.target) {
                SetTouchMoveElement(e)
            }
        }
    } else if (Type == 'Both') {
        let Direction = arguments.Direction || 'Rtl'
        let Max = arguments.Max || 'WidthWindow'
        let Min = arguments.Min || 0
        Element.ontouchmove = function (e) {
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
            i.addEventListener('click', function (e) {
                if (e.target.getAttribute('IconCloseMenu') == null) {
                    OpenMenuContainer(Element)
                }
            })
        }
        document.addEventListener('click', VarStateEventClickDoc = function (event) {
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
    i.onclick = function (e) {
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
            throw (` Attribute "ClickFunc" In One of The Elements or above Is Wrong`)
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


function CheckInputValInit() {
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
}

CheckInputValInit()

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
            } catch (e) {
            }
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
    I.addEventListener('focus', function (e) {
        EffectOnItemFormInput(e.currentTarget.parentNode)
    })
    I.addEventListener('focusout', function (e) {
        ClearEffectOnItemFormInput(e.currentTarget.parentNode)
    })
}


function SignOutAccountMenu() {
    setTimeout(function () {
        CloseMenuContainer(document.getElementById('ContainerMenuHamburger'))
    })
    SignOutAccount()
}


function GetKeyByValue(Obj, Val) {
    return Object.keys(Obj).find(K => Obj[K] === Val);
}

let COUNTER_SHOW_ERROR_AJAX = true

function SendAjax(Url, Data = {}, Method = 'POST', Response, async_req = true, auth, login_redirect = true, loading_show = true, loading_section = null) {
    function __Redirect__(response) {
        if (response.__Redirect__ == 'True') {
            setTimeout(function () {
                window.location.href = response.__RedirectURL__
            }, parseInt(response.__RedirectAfter__ || 0))
        }
    }

    let timer_loading

    function Loading(State) {
        if (loading_show) {
            if (State == 'Show') {
                if (!loading_section) {
                    LockAllElements()
                    timer_loading = setTimeout(function () {
                        Loading('Hide')
                        let ContainerLoading = document.createElement('div')
                        let CircleLoading = document.createElement('div')
                        ContainerLoading.id = 'ContainerLoadingAJAX'
                        ContainerLoading.classList.add('ContainerLoadingAJAX')
                        ContainerLoading.innerHTML = `
                                <div class="LoadingCircle"><span></span></div>
                            `
                        ContainerLoading.innerHTML = `
                                <img src="assets/img/logo.png" alt="logo">
                            `
                        document.body.classList.add('is-loading')
                        document.body.appendChild(ContainerLoading)
                    }, 300)
                } else {
                    // Loading in btn
                    loading_section.classList.add('loading-section')
                }

            } else {
                if (!loading_section) {
                    document.body.classList.remove('is-loading')
                    try {
                        UnlockAllElements()
                        document.getElementById('ContainerLoadingAJAX').remove()
                    } catch (e) {
                    }
                    try {
                        clearTimeout(timer_loading)
                    } catch (e) {
                    }
                } else {
                    // remove Loading btn
                    loading_section.classList.remove('loading-section')
                }
            }
        }
    }

    if (Response == undefined) {
        Response = function (response) {
            __Redirect__(response)
        }
    }
    // if (Failed == undefined) {
    //     Failed = function (response) {
    //         ShowNotificationMessage('Could not connect to server ', 'Error', 10000, 2)
    //     }
    // }
    let headers = {
        // 'X-CSRFToken': window.CSRF_TOKEN
        'Content-Type': 'application/json',
    }

    if (auth) {
        let access_token = ''
        let tokens = GET_USER_TOKEN(login_redirect)
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
        success: function (response) {
            __Redirect__(response)
            Loading('Hide')
            response.success = true
            Response(response)
        },
        failed: function (response) {
            __Redirect__(response)
            Loading('Hide')
            response = response.responseJSON
            response.success = false
            Response(response)
        },
        error: function (response) {
            __Redirect__(response)
            if (response.responseJSON) {
                response = response.responseJSON
            } else {
                response = {
                    'error': 'Server Error 500',
                    'status': response.status
                }
            }
            response.success = false
            if (COUNTER_SHOW_ERROR_AJAX && response.status == 0) {
                COUNTER_SHOW_ERROR_AJAX = false
                ShowNotificationMessage('Could not connect to server ', 'Error', 10000000, 3)
            } else {
                Loading('Hide')
                Response(response)
            }

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
        setTimeout(function () {
            RemoveNotification_Func(Index_Notification)
        }, Timer)

        BtnClose.onclick = function (e) {
            let Index_Notification = e.target.getAttribute('Index_Notification')
            RemoveNotification_Func(Index_Notification)
        }
    }

}

function RemoveNotification_Func(Index) {
    let Instance = LIST_ALL_NOTIFICATIONS_INSTANCE[Index]
    Instance.ContainerMessage.classList.add('Notification_Removed')
    setTimeout(function () {
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
    setTimeout(function () {
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

        BtnClose.onclick = function () {
            if (FuncWhenCancel != null) {
                FuncWhenCancel()
            }
            CloseMessage_Alert()
        }
        BtnClose1.onclick = function () {
            if (FuncWhenCancel != null) {
                FuncWhenCancel()
            }
            CloseMessage_Alert()
        }

        BtnOk.onclick = function () {
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
        ClickOutSideContainer(Container, function () {
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
    } catch (e) {
    }
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
    let _ = setInterval(function () {
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