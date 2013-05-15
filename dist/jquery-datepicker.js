/*! Datepicker - v0.1.0 - 2013-05-15
* https://github.com/amazingsurge/jquery-datepicker
* Copyright (c) 2013 amazingSurge; Licensed MIT */
(function($) {

    var Datepicker = $.daypicker = function(element, options) {
        this.el = $(element);
        this.options = $.extend(true, {}, Datepicker.defaults, options);
        this.format = this.parse_format(this.options.format || 'mm/dd/yyyy');
        this.namespace = this.options.namespace;
        this.init();
    };

    var LABEL = {};

    Datepicker.defaults = {
        first_day_of_week: 1,

        mode: 'single', //single|range|multiple

        calendars: 2,

        date: 'today', //today|Date with this.options.format

        max: null,//null|days|Date with this.options.format
        min: null,//null|days|Date with this.options.format

        position: 'bottom',//top|right|bottom|left|rightTop|leftTop
        alwaysShow: false, // true or false 

        selectable: [],

        lang: 'en', //'chinese'
        views: ['days'],
        format: 'yyyy/mm/dd',
        namespace: 'calendar',
        tpl_wrapper: '<div class="namespace-wrap">' + '</div>',
        tpl_content: '<div class="namespace">' + 
                        '<div class="namespace-head">' + 
                            '<span class="namespace-prev"></span>' + 
                            '<span class="namespace-caption"></span>' + 
                            '<span class="namespace-next"></span>' + 
                        '</div>' + 
                        '<table class="namespace-days"></table>' + 
                        '<table class="namespace-months"></table>' + 
                        '<table class="namespace-years"></table>' + 
                     '</div>', 
        localize: function(lang, label) {
            LABEL[lang] = label;
        },
        onRender: function(){return {};},
        onChange: function(){return true;},
        onShow: function(){return true;},
        onBeforeShow: function(){return true;},
        onHide: function(){return true;}
    };

    Datepicker.defaults.localize( "en", {
        days:           ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        days_short:     ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months:         ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        months_short:   ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        // caption_format: 'mm yyyy'
    });

    Datepicker.defaults.localize( "zh", {
        days:           ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        days_short:     ["日", "一", "二", "三", "四", "五", "六"],
        months:         ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        months_short:   ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"], 
        // caption_format: 'yyyy年m月dd日'
    });


    Datepicker.prototype = {
        constructor: Datepicker,

        init: function() {

            var tpl_wrapper = this.options.tpl_wrapper.replace(/namespace/g, this.namespace);
            var tpl_content = this.options.tpl_content.replace(/namespace/g, this.namespace);

            var html = '';
            this.picker = $(tpl_wrapper)
                .appendTo('body')
                .on({
                click: $.proxy(this.click, this)
            });

            if(this.options.date !== 'today') {
                var date = this.parse_date(this.options.date, this.format);
                this.default_date = date;
            } else {
                this.default_date = new Date();
            }


            this.selected_date = this.options.date === 'today' ? [new Date()] : [new Date(date)];
            this.current_date = this.options.date === 'today' ? [new Date()] : [new Date(date)];

            if (this.options.mode === 'single') {
                html += tpl_content;
                this.current_date[0].setHours(0,0,0,0);
                this.selected_date[0].setHours(0,0,0,0);
            }else {
                if (this.options.mode === 'range') {
                    this.options.calendars = 2;
                } else if (this.options.mode === 'multiple') {
                    this.multiple_date = [];
                }
                for (var i = 0; i < this.options.calendars; i++) {
                    html += tpl_content;
                    if(this.options.views[i] === undefined) {
                        this.options.views[i] = 'days';
                    }
                    if (this.current_date[i] === undefined) {
                        this.current_date[i] = this.options.date === 'today' ? new Date() : new Date(date);
                    }
                    if (this.selected_date[i] === undefined) {
                        this.selected_date[i] = this.options.date === 'today' ? new Date() : new Date(date);
                    }
                    this.current_date[i].setHours(0,0,0,0);
                    this.selected_date[i].setHours(0,0,0,0);
                }
            }

            this.picker.append(html);

            this.view = this.options.views;
            this.calendar = this.picker.find('.' + this.namespace);
            this.calendar_prev = this.calendar.find('.' + this.namespace + '-prev');
            this.calendar_caption = this.calendar.find('.' + this.namespace + '-caption');
            this.calendar_next = this.calendar.find('.' + this.namespace + '-next');
            this.daypicker = this.calendar.find('.' + this.namespace + '-days');
            this.monthpicker = this.calendar.find('.' + this.namespace + '-months');
            this.yearpicker = this.calendar.find('.' + this.namespace + '-years');

            if (this.options.min !== null) {
                this.min_year = this.getMin().getFullYear(), this.min_month = this.getMin().getMonth();
            }
            if (this.options.max !== null) {
                this.max_year = this.getMax().getFullYear(), this.max_month = this.getMax().getMonth();
            }

            this.date_update();

            if(this.options.mode === 'multiple') {
                for (var i = 0; i < this.options.calendars; i++) {
                   this.set_date(this.current_date[i], 'month', this.current_month[i] + i );
                }
                this.date_update();
            }

            if (this.options.mode === 'single') {
                this.manage_views(0);
            }else {
                for (var i=0; i<this.options.calendars; i++) {
                    this.manage_views(i);
                }
            }

            this.is_input = this.el.is('input');

            if (this.is_input) {
                if (this.options.alwaysShow === false) {
                    this.el.on({
                        focus: $.proxy(this.show, this)
                        // ,
                        // keyup: $.proxy(this.update, this)
                    });
                } else {
                    this.show();
                }    
            } else {
                this.el = '';
            }
            this.set_value();
        },

        changeOptions: function(obj) {
            for (var x in obj) {
                this.options[x] = obj[x]
            }
            this.destroy();
            this.init();
        },

        show: function() {
            
            this.picker.fadeIn("normal");
            this.picker.show();
            var self = this;

            this.position();
            
            if (this.options.alwaysShow === false) {
                $(document).on('mousedown', function(ev) {
                    if ($(ev.target).closest(self.calendar).length === 0 && $(ev.target).closest(self.el).length === 0) {
                        self.hide();
                    }
                });
            }
            
        },

        hide: function() {
            var self = this;
            this.picker.fadeOut("normal", function () {
                self.picker.hide();
            });
        },

        multipleClear: function () {
            this.multiple_date = [];
            for (var i = 0; i<this.options.calendars; i++) {
                this.manage_views(i);
            }
            this.set_value();
        },

        getWrap: function() {
            return this.picker;
        },

        getInput: function() {
            return this.el;
        },

        getDate: function(format) {
            if (format === undefined) {
                if (this.options.mode === "multiple") {
                    var date = [];
                    for(var i = 0; i < this.multiple_date.length; i++) {
                        date[i] = new Date(this.multiple_date[i]);
                    }
                    return date;
                } else {
                    return this.selected_date;
                }
                
            }else {
                var _format = this.parse_format(format),
                    formated = [];
                if (this.options.mode === "multiple") {
                    for(var i = 0; i < this.multiple_date.length; i++) {    
                        formated[i] = this.format_date(new Date(this.multiple_date[i]), _format);
                    }
                } else {
                    for(var i = 0; i < this.selected_date.length; i++) {
                        formated[i] = this.format_date(this.selected_date[i], _format);
                    }
                }
                return formated;
            }
        },

        getMax: function() {
            var max = this.el.attr("max") || this.options.max,
                day = this.default_date.getDate(),
                max_date;
            if (max) {
                if(typeof(max) === 'number'){
                    max_date = new Date(this.default_date);
                    max_date.setDate(day + max);
                }else{
                    if(typeof(max) === 'string') {
                        var separator = max.match(/[.\/\-\s].*?/);
                        if (max.split(separator).length !== 3) {
                            max = parseInt(max);
                        }
                    }
                    max_date = this.parse_date(max, this.format);
                }
                return max_date;
            } else {
                return false;
            }           
        },

        getMin: function() {
            var min = this.el.attr("min") || this.options.min,
                day = this.default_date.getDate(),
                min_date;
            if (min) {
                if(typeof(min) === 'number'){
                    min_date = new Date(this.default_date);
                    min_date.setDate(day - min);
                }else{
                    if(typeof(min) === 'string') {
                        var separator = min.match(/[.\/\-\s].*?/);
                        if (min.split(separator).length !== 3) {
                            min = parseInt(min);
                        }
                    }
                    min_date = this.parse_date(min, this.format);
                }
                return min_date;
            } else {
                return false;
            }
        },

        destroy: function() {
            this.el.removeData('datepicker');
            this.getWrap().remove();
        },

        position: function() {
            var win_height = window.innerHeight,
                win_width = window.innerWidth,
                calendar_height = this.picker.outerHeight(),
                calendar_width = this.picker.outerWidth(),
                input_top = this.el.offset().top,
                input_left = this.el.offset().left,
                input_height = this.el.outerHeight(),
                input_width = this.el.outerWidth(),
                scroll_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
                scroll_left = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
                to_top = input_top - scroll_top,
                to_bottom = win_height - to_top - input_height,
                to_left = input_left - scroll_left,
                to_right = win_width - to_left - input_width;

            if (this.options.position === 'top') {
                this.picker.css({
                    "left": to_left + scroll_left,
                    "top": to_top - calendar_height + scroll_top
                });
            } else if (this.options.position === 'right') {
                this.picker.css ({
                    "left" : to_left + input_width + scroll_left,
                    "top" : to_top + scroll_top
                });
            } else if (this.options.position === 'bottom') {
                this.picker.css({
                    "left": to_left + scroll_left,
                    "top": to_top + input_height + scroll_top
                });
            } else if (this.options.position === 'left') {
                this.picker.css ({
                    "left" : to_left - calendar_width + scroll_left,
                    "top" : to_top + scroll_top
                });
            } else if (this.options.position === 'rightTop') {
                this.picker.css ({
                    "left" : to_left + input_width + scroll_left,
                    "top" : to_top - calendar_height + input_height + scroll_top
                });
            } else if (this.options.position === 'leftTop') {
                this.picker.css ({
                    "left" : to_left - calendar_width + scroll_left,
                    "top" : to_top - calendar_height + input_height + scroll_top
                });
            }
        },

        set_value: function(j) {
            if (this.options.mode === 'single') {
                var formated = this.format_date(this.selected_date[0], this.format);
                this.el.val(formated);
            } else {
                if (this.options.mode === 'range') {
                    var formated_start = this.format_date(this.selected_date[0], this.format);
                    var formated_end = this.format_date(this.selected_date[1], this.format);
                    this.el.val(formated_start + ' - ' + formated_end);
                } else if (this.options.mode === 'multiple') {
                    var val = '', formated;
                    for (var i = 0; i < this.multiple_date.length; i++) {
                        formated = this.format_date(new Date(this.multiple_date[i]), this.format);
                        if (val.length === 0) {
                            val += formated;
                        } else {
                            val += (',' + formated);
                        }
                    }
                    this.el.val(val);
                }
            }
        },

        set_date: function(obj, YTD, date) {
            switch (YTD) {
                case 'day':
                    obj.setDate(date);
                    break;
                case 'month':
                    obj.setMonth(date);
                    break;
                case 'year':
                    obj.setYear(date);
                    break;
            }
        },

        str_pad: function(str, len) {
            str += '';
            while (str.length < len) {str = '0' + str;}
            return str;
        },

        str_concat: function() {
            var str = '';
            for (var i = 0; i < arguments.length; i++) {str += (arguments[i] + '');}
            return str;
        },

        parse_format: function(format) {
            var separator = format.match(/[.\/\-\s].*?/),
                parts = format.split(/\W+/) || parts;
            if (!parts || parts.length === 0) {
                throw new Error('Invalid date format.');
            }
            return {
                separator: separator,
                parts: parts
            };
        },

        parse_date: function(date, format) {
            var parts = date.split(format.separator) || parts,
                date = new Date(),
                val;
            // date = new Date();
            date.setHours(0,0,0,0);
            if (parts.length === format.parts.length) {
                for (var i = 0, length = format.parts.length; i < length; i++) {
                    val = parseInt(parts[i], 10) || 1;
                    if (val === '1') {
                        return;
                    }
                    switch (format.parts[i]) {
                        case 'dd':
                        case 'd':
                            date.setDate(val);
                            break;
                        case 'mm':
                        case 'm':
                            date.setMonth(val - 1);
                            break;
                        case 'yy':
                            date.setFullYear(2000 + val);
                            break;
                        case 'yyyy':
                            date.setFullYear(val);
                            break;
                    }
                }
            }
            return date;
        },

        format_date: function(date, format) {
            var val = {
                d: date.getDate(),
                m: date.getMonth() + 1,
                yy: date.getFullYear().toString().substring(2),
                yyyy: date.getFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            date = [];
            for (var i = 0, length = format.parts.length; i < length; i++) {
                date.push(val[format.parts[i]]);
            }
            return date.join(format.separator);
        },

        date_update: function() {
            if (this.options.mode === 'single') {
                this.current_day = [this.current_date[0].getDate()];
                this.current_month = [this.current_date[0].getMonth()];
                this.current_year = [this.current_date[0].getFullYear()];

                this.selected_day = [this.selected_date[0].getDate()];
                this.selected_month = [this.selected_date[0].getMonth()];
                this.selected_year = [this.selected_date[0].getFullYear()];
            } else {
                    this.current_day = [];
                    this.current_month = [];
                    this.current_year = [];

                    this.selected_day = [];
                    this.selected_month = [];
                    this.selected_year = [];

                for (var i = 0; i < this.options.calendars; i++) {
                    this.current_day[i] = this.current_date[i].getDate();
                    this.current_month[i] = this.current_date[i].getMonth();
                    this.current_year[i] = this.current_date[i].getFullYear();

                    this.selected_day[i] = this.selected_date[i].getDate();
                    this.selected_month[i] = this.selected_date[i].getMonth();
                    this.selected_year[i] = this.selected_date[i].getFullYear();
                }
            }
        },

        generate_daypicker: function(j) {
             var
                days_in_month = new Date(this.current_year[j], this.current_month[j] + 1, 0).getDate(),
                first_day = new Date(this.current_year[j], this.current_month[j], 2).getDay(),
                days_in_prev_month = new Date(this.current_year[j], this.current_month[j], 0).getDate(),
                days_from_prev_month = first_day - this.options.first_day_of_week,
                html = '<thead>' + '<tr class="' + this.namespace + '-week">';

            if (this.options.mode === 'single') {
                var year = this.current_year[0], month = this.current_month[0];
                if (this.options.max !== null) {
                   if (year > this.max_year) {
                        this.calendar_next.addClass(this.namespace + '-blocked'); 
                    } else if (year < this.max_year){
                        this.calendar_next.removeClass(this.namespace + '-blocked');
                    } else {
                        if(month >= this.max_month) {
                            this.calendar_next.addClass(this.namespace + '-blocked'); 
                        } else {
                            this.calendar_next.removeClass(this.namespace + '-blocked');
                        }
                    } 
                }
                
                if (this.options.min !== null) {
                    if (year < this.min_year) {
                        this.calendar_prev.addClass(this.namespace + '-blocked'); 
                    } else if (year > this.min_year){
                        this.calendar_prev.removeClass(this.namespace + '-blocked');
                    } else {
                        if(month <= this.min_month) {
                            this.calendar_prev.addClass(this.namespace + '-blocked'); 
                        } else {
                            this.calendar_prev.removeClass(this.namespace + '-blocked');
                        }
                    }
                }

            } else if (this.options.mode === 'range') {
                var current_start = this.current_date[0],
                    current_end = this.current_date[1],
                    selected_start = this.selected_date[0],
                    selected_end = this.selected_date[1],
                    date_array = [];

                if (j>0) {
                    if (this.current_year[j] === this.selected_year[j-1]) {
                        if(this.current_month[j] <= this.selected_month[j-1]){
                           this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                        }else if(this.calendar_prev.eq(j).hasClass(this.namespace + '-blocked') === true) {
                            this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                        }  
                    } else if(this.calendar_prev.eq(j).hasClass(this.namespace + '-blocked') === true) {
                        this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                    }
                    if (this.options.max !== null) {
                        if (this.current_year[j] > this.max_year) {
                            this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                        } else if (this.current_year[j] < this.max_year) {
                            this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                        } else {
                            if (this.current_month[j] >= this.max_month) {
                                this.calendar_next.eq(j).addClass(this.namespace + '-blocked'); 
                            } else {
                                this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                            }
                        }
                    }


                } else {
                    if (this.current_year[j] === this.selected_year[j+1]) {
                        if(this.current_month[j] >= this.selected_month[j+1]){
                           this.calendar_next.eq(j).addClass(this.namespace + '-blocked'); 
                        }else if(this.calendar_next.eq(j).hasClass(this.namespace + '-blocked') === true) {
                            this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                        }
                    } else if(this.calendar_next.eq(j).hasClass(this.namespace + '-blocked') === true) {
                        this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                    }

                    if (this.options.min !== null) {
                        if (this.current_year[j] < this.min_year) {
                            this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                        } else if (this.current_year[j] > this.min_year){
                            this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                        } else {
                            if(this.current_month[j] <= this.min_month) {
                                this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                            } else {
                                this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                            }
                        }
                    }
                }
            } else if (this.options.mode === 'multiple') {
                this.calendar_caption.eq(j).addClass(this.namespace + '-blocked');
                if (j === 0) {
                    var i = this.options.calendars - 1;
                    this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                    if (this.options.min !== null) {
                        if (this.current_year[j] === this.min_year) {
                            if (this.current_month[j] <= this.min_month) {
                                this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');
                            } else {
                                this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                            }
                        } else if (this.current_year[j] < this.min_year){
                            this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');
                        } else {
                            this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked'); 
                        }
                    }
                    
                }else if (j === this.options.calendars - 1) {
                    this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');
                    if (this.options.max !== null) {
                        if (this.current_year[j] === this.max_year) {
                            if (this.current_month[j] >= this.max_month) {
                                this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                            } else {
                                this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                            }
                        } else if (this.current_year[j] > this.max_year){
                            this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                        } else {
                            this.calendar_next.eq(j).removeClass(this.namespace + '-blocked'); 
                        }
                    }
                } else {
                    this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                    this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                }
            }

            days_from_prev_month = days_from_prev_month < 0 ? 7 + days_from_prev_month : days_from_prev_month;

            this.manage_header(LABEL[this.options.lang].months[this.current_month[j]] + ' ' + this.current_year[j], j);

            for (var i = 0; i < 7; i++) {
                html += '<th>' + LABEL[this.options.lang].days_short[i] + '</th>';
            }
            html += '</tr>' + '</thead>';
            html += '<tbody>' + '<tr>';

            for (i = 0; i < 42; i++) { 
                var day = (i - days_from_prev_month + 1);

                if (i > 0 && i % 7 === 0) {
                    html += '</tr><tr>';
                }

                if (this.options.mode === 'single') {
                    var class_name = '';    
                        content = 0;
                        date_array = [];
                    if (i < days_from_prev_month) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] - 1), (days_in_prev_month - days_from_prev_month + i + 1), 0, 0, 0, 0);
                        class_name = 'otherMonthDay';
                        content = (days_in_prev_month - days_from_prev_month + i + 1);
                    } else if (i > (days_in_month + days_from_prev_month - 1)) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] + 1), (day - days_in_month), 0, 0, 0, 0);
                        class_name = 'otherMonthDay';
                        content = (day - days_in_month);
                    } else {
                        date_array[i] =  new Date(this.current_year[j], this.current_month[j], day, 0, 0, 0, 0); 
                        if (Date.parse(date_array[i]) == Date.parse(this.selected_date[0])) {
                            class_name = 'is-active';
                        }        
                        content = day;
                    }

                    if (this.options.min !== null) {
                        if (Date.parse(this.getMin()) > Date.parse(date_array[i])) {
                            class_name += ' is-untouchable';  
                        }
                    }

                    if (this.options.max !== null) {
                        if (Date.parse(this.getMax()) < Date.parse(date_array[i])) {
                            class_name += ' is-untouchable';  
                        }
                    }

                } 
                else if (this.options.mode === 'range') {
                    var class_name = '';
                        content = 0;
                        date_array = [];
                    if (i < days_from_prev_month) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] - 1), (days_in_prev_month - days_from_prev_month + i + 1), 0, 0, 0, 0);
                        class_name = 'otherMonthDay';
                        if (j===0){
                            if (Date.parse(date_array[i]) == Date.parse(selected_start)) {
                                class_name += ' is-active';
                            } else if (date_array[i] > selected_start && date_array[i] <= selected_end) {
                                class_name += ' in-range';
                            }
                        }else if (j===1) {
                            if (Date.parse(date_array[i]) == Date.parse(selected_end)) {
                                class_name += ' is-active';
                            } else if (date_array[i] >= selected_start && date_array[i] < selected_end) {
                                class_name += ' in-range';
                            } else if (date_array[i] < selected_start) {
                                class_name += ' is-untouchable'; 
                            }
                        }


                        if (this.options.min !== null) {
                            if (Date.parse(this.getMin()) > Date.parse(date_array[i])) {
                                class_name += ' is-untouchable';  
                            }
                        }

                        if (this.options.max !== null) {
                            if (Date.parse(this.getMax()) < Date.parse(date_array[i])) {
                                class_name += ' is-untouchable';  
                            }
                        }
                        content = (days_in_prev_month - days_from_prev_month + i + 1);

                    } else if (i > (days_in_month + days_from_prev_month - 1)) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] + 1), (day - days_in_month), 0, 0, 0, 0);
                        class_name = 'otherMonthDay';
                        if (j===0){
                            if (Date.parse(date_array[i]) == Date.parse(selected_start)) {
                                class_name += ' is-active';
                            } else if (date_array[i] > selected_start && date_array[i] <= selected_end) {
                                class_name += ' in-range';
                            } else if (date_array[i] > selected_end) {
                                class_name += ' is-untouchable'; 
                            }
                        }else if (j===1) {
                            if (Date.parse(date_array[i]) == Date.parse(selected_end)) {
                                class_name += ' is-active';
                            } else if (date_array[i] >= selected_start && date_array[i] < selected_end) {
                                class_name += ' in-range';
                            }
                        }
                        if (this.options.min !== null) {
                            if (Date.parse(this.getMin()) > Date.parse(date_array[i])) {
                                class_name += ' is-untouchable';  
                            }
                        }

                        if (this.options.max !== null) {
                            if (Date.parse(this.getMax()) < Date.parse(date_array[i])) {
                                class_name += ' is-untouchable';  
                            }
                        }
                        content = (day - days_in_month);
                        
                    } else {
                        date_array[i] =  new Date(this.current_year[j], this.current_month[j], day, 0, 0, 0, 0);                
                        if (j===0){
                            if (Date.parse(date_array[i]) == Date.parse(selected_start)) {
                                class_name = 'is-active';
                            } else if (date_array[i] > selected_start && date_array[i] <= selected_end) {
                                class_name = 'in-range';
                            } else if (date_array[i] > selected_end) {
                                class_name = 'is-untouchable';
                            }
                        }else if (j===1) {
                            if (Date.parse(date_array[i]) == Date.parse(selected_end)) {
                                class_name = 'is-active';
                            } else if (date_array[i] >= selected_start && date_array[i] < selected_end) {
                                class_name = 'in-range';
                            } else if (date_array[i] < selected_start) {
                                class_name = 'is-untouchable';
                            }
                        }

                        if (this.options.min !== null) {
                            if (Date.parse(this.getMin()) > Date.parse(date_array[i])) {
                                class_name += 'is-untouchable';  
                            }
                        }

                        if (this.options.max !== null) {
                            if (Date.parse(this.getMax()) < Date.parse(date_array[i])) {
                                class_name += 'is-untouchable';
                            }
                        }

                        content = day;
                    }
                    
                } 
                else if (this.options.mode === 'multiple') {
                    var class_name = '';    
                        content = 0;
                        date_array = [];
                    if (i < days_from_prev_month) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] - 1), (days_in_prev_month - days_from_prev_month + i + 1), 0, 0, 0, 0);
                        class_name += ' otherMonthDay';

                        content = (days_in_prev_month - days_from_prev_month + i + 1);
                    } else if (i > (days_in_month + days_from_prev_month - 1)) {
                        date_array[i] = new Date(this.current_year[j], (this.current_month[j] + 1), (day - days_in_month), 0, 0, 0, 0);
                        class_name += ' otherMonthDay';

                        content = (day - days_in_month);
                    } else {
                        date_array[i] =  new Date(this.current_year[j], this.current_month[j], day, 0, 0, 0, 0);                

                        content = day;
                    }

                    for (var k = 0; k < this.multiple_date.length; k++) {
                        if (this.multiple_date[k] === Date.parse(date_array[i])) {
                            class_name += ' is-active';
                        }
                    }

                    if (this.options.min !== null) {
                        if (Date.parse(this.getMin()) > Date.parse(date_array[i])) {
                            class_name += ' is-untouchable'; 
                        }
                    }

                    if (this.options.max !== null) {
                        if (Date.parse(this.getMax()) < Date.parse(date_array[i])) {
                            class_name += ' is-untouchable';
                        }
                    }

                }
                html += '<td class="' + class_name + '">' + content + '</td>';         
            }
            html += '</tr>';
            this.daypicker.eq(j).html(html); 
        },

        generate_monthpicker: function(j) {
            this.manage_header(this.current_year[j], j);
            var content =  LABEL[this.options.lang].months_short;

            if (this.options.mode === 'single') {
                var date_array = [];
                if (this.options.max !== null) {
                    if (this.current_year[0] >= this.max_year) {
                        this.calendar_next.eq(j).addClass(this.namespace + '-blocked');  
                    } else {
                        this.calendar_next.eq(j).removeClass(this.namespace + '-blocked'); 
                    }
                }
                if (this.options.min !== null) {
                    if (this.current_year[0] <= this.min_year) {
                        this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');
                    } else {
                        this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                    }
                }
            } else if (this.options.mode === 'range'){
                var current_start = new Date (this.current_year[0], this.current_month[0], 1, 0, 0, 0, 0),
                    current_end = new Date (this.current_year[1], this.current_month[1], 1, 0, 0, 0, 0),
                    selected_start =new Date (this.selected_year[0], this.selected_month[0], 1, 0, 0, 0, 0),
                    selected_end = new Date (this.selected_year[1], this.selected_month[1], 1, 0, 0, 0, 0),
                    date_array = [];

                if (j>0) {
                    if (this.current_year[j] <= this.selected_year[j-1]) {
                           this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');   
                    } else {
                        this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                    }
                    if (this.options.max !== null) {
                        if (this.current_year[j] >= this.max_year) {
                            this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                        } else {
                            this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                        }
                    }

                } else {
                    if (this.current_year[j] === this.selected_year[j+1]) {
                           this.calendar_next.eq(j).addClass(this.namespace + '-blocked'); 
                    } else if(this.calendar_next.eq(j).hasClass(this.namespace + '-blocked') === true) {
                        this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                    }
                    if (this.options.min !== null) {
                        if (this.current_year[j] <= this.min_year) {
                            this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                        } else {
                            this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                        }
                    }
                }
            }

            var html = '<tr>';
            for (var i = 0; i < 12; i++) {
                if (i > 0 && i % 3 === 0) {
                    html += '</tr><tr>';
                }
                if (this.options.mode === 'single') {
                    var class_name = 'month-' + i;
                    date_array[i] = new Date(this.current_year[j], i, 1, 0, 0, 0, 0);
                    if (Date.parse(date_array[i]) === Date.parse(new Date (this.selected_year[0], this.selected_month[0], 1, 0, 0, 0, 0))) {
                        class_name += ' is-active';
                    }

                    if (this.options.min !== null) {
                        if (Date.parse(new Date(this.min_year, this.min_month,1, 0, 0, 0, 0)) > Date.parse(date_array[i])) {
                            class_name += ' is-untouchable';
                        }
                    }

                    if (this.options.max !== null) {
                        if (Date.parse(new Date(this.max_year, this.max_month, 1, 0, 0, 0, 0)) < Date.parse(date_array[i])) {
                            class_name += ' is-untouchable'; 
                        }
                    }

                } else if (this.options.mode === 'range') {
                    var class_name = 'month-' + i;
                    date_array[i] = new Date(this.current_year[j], i, 1, 0, 0, 0, 0);
                    if (j > 0) {
                        if (Date.parse(date_array[i]) === Date.parse(selected_end)) {
                            class_name += ' is-active';
                        } else if (date_array[i] < selected_start){
                            class_name += ' is-untouchable';
                        } else if (date_array[i] < selected_end && date_array[i] >= selected_start) {
                            class_name += ' in-range';
                        }
                    } else {
                        if (Date.parse(date_array[i]) === Date.parse(selected_start)) {
                            class_name += ' is-active';
                        } else if (date_array[i] > selected_end) {
                            class_name += ' is-untouchable';
                        } else if (date_array[i] <= selected_end && date_array[i] > selected_start) {
                            class_name += ' in-range';
                        }
                    }

                    if (this.options.min !== null) {
                        if (Date.parse(new Date(this.min_year, this.min_month, 1, 0, 0, 0, 0)) > Date.parse(date_array[i])) {
                            class_name += ' is-untouchable';
                        }
                    }

                    if (this.options.max !== null) {
                        if (Date.parse(new Date(this.max_year, this.max_month, 1, 0, 0, 0, 0)) < Date.parse(date_array[i])) {
                            class_name += ' is-untouchable'; 
                        }
                    }
                }

                html += '<td class="' + class_name + '">' + content[i] + '</td>';     
            }
            html += '</tr>';
            this.monthpicker.eq(j).html(html);
        },

        generate_yearpicker: function(j) {
            this.manage_header(this.current_year[j] - 7 + ' - ' + (this.current_year[j] + 4), j);

            if (this.options.mode === 'single') {
                if (this.options.min !== null) {
                    if ((this.current_year[0]-7) < this.min_year) {
                       this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                    } else {
                        this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                    }
                }

                if (this.options.max !== null) {
                    if ((this.current_year[0]+4) > this.max_year) {
                        this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                    } else {
                        this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                    }
                }

            } else if (this.options.mode === 'range'){
                var current_start = this.current_date[0].getFullYear(),
                    current_end = this.current_date[1].getFullYear(),
                    selected_start = this.selected_date[0].getFullYear(),
                    selected_end = this.selected_date[1].getFullYear();

                if (j>0) {
                    if ((this.current_year[j] - 7) <= this.selected_year[j-1]) {
                           this.calendar_prev.eq(j).addClass(this.namespace + '-blocked');   
                    } else {
                        this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                    }

                    if (this.options.max !== null) {
                        if (this.current_year[j] + 4 >= this.max_year) {
                            this.calendar_next.eq(j).addClass(this.namespace + '-blocked');
                        } else {
                            this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                        }
                    }
  
                } else {
                    if ((this.current_year[j] + 4) >= this.selected_year[j+1]) {
                           this.calendar_next.eq(j).addClass(this.namespace + '-blocked'); 
                    } else {
                        this.calendar_next.eq(j).removeClass(this.namespace + '-blocked');
                    }

                    if (this.options.min !== null) {
                        if (this.current_year[j] - 7 <= this.min_year) {
                            this.calendar_prev.eq(j).addClass(this.namespace + '-blocked'); 
                        } else {
                            this.calendar_prev.eq(j).removeClass(this.namespace + '-blocked');
                        }
                    }
                }
            }

            
            var html = '<tr>';
            for (var i = 0; i < 12; i++) {
                var year = (this.current_year[j] - 7 + i);

                if (i > 0 && i % 3 === 0) {
                    html += '</tr><tr>';
                }
                if (this.options.mode === 'single') {
                    var class_name = '';

                    if (year === this.selected_year[j]) {
                        class_name = 'is-active';
                    } else {
                        class_name = '';
                        if (this.options.min !== null) {
                            if (year < this.min_year) {
                                class_name = 'is-untouchable';
                            }
                        }
                        if (this.options.max !== null) {
                            if (year > this.max_year) {
                               class_name = 'is-untouchable'; 
                            }
                        }
                    }

                } else if (this.options.mode === 'range') {
                    var class_name = '';

                    if (j > 0) {
                        if (year === selected_end) {
                            class_name = 'is-active';
                        } else if (year < selected_start){
                            class_name = 'is-untouchable';
                        } else if (year < selected_end && year >= selected_start) {
                            class_name = 'in-range';
                        }
                    } else {
                        if (year === selected_start) {
                            class_name = 'is-active';
                        } else if (year > selected_end) {
                            class_name = 'is-untouchable';
                        } else if (year <= selected_end && year > selected_start) {
                            class_name = 'in-range';
                        }
                    }

                    if (this.options.min !== null) {
                        if (year < this.min_year) {
                            class_name = 'is-untouchable';
                        }
                    }
                    if (this.options.max !== null) {
                        if (year > this.max_year) {
                           class_name = 'is-untouchable'; 
                        }
                    }
                }
                html += '<td class="' + class_name + '">' + year + '</td>';
            }
            html += '</tr>';
            this.yearpicker.eq(j).html(html);
        },

        manage_header: function(caption, j) {
            this.calendar.eq(j).find('.' + this.namespace + '-caption').html(caption);
        },

        manage_views: function(j) {
            if (this.view[j] === 'days') {
                this.generate_daypicker(j);
                this.daypicker.eq(j).css('display', 'block');
                this.monthpicker.eq(j).hide();
                this.yearpicker.eq(j).hide();

            } else if (this.view[j] === 'months') {
                this.generate_monthpicker(j);
                this.daypicker.eq(j).hide();
                this.monthpicker.eq(j).css('display', 'block');
                this.yearpicker.eq(j).hide();

            } else if (this.view[j] === 'years') {
                this.generate_yearpicker(j);
                this.daypicker.eq(j).hide();
                this.monthpicker.eq(j).hide();
                this.yearpicker.eq(j).css('display', 'block');
            }
        },

        prev: function(j) {
            if (!$(this).hasClass(this.namespace + '-blocked')) {
                if (this.options.mode !== 'multiple') {
                    if (this.view[j] === 'days') {
                        if (--this.current_month[j] < 0) {
                            this.current_month[j] = 11;
                            this.current_year[j]--;
                        }
                        this.set_date(this.current_date[j], 'month', this.current_month[j]);
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    } else if (this.view[j] === 'months') {
                        this.current_year[j]--;
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    } else if (this.view[j] === 'years') {
                        this.current_year[j] -= 12;
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    }
                    this.date_update();
                    this.manage_views(j);
                } else {
                    for (var i = 0; i < this.options.calendars; i++) {
                        if (this.view[i] === 'days') {
                            if (--this.current_month[i] < 0) {
                                this.current_month[i] = 11;
                                this.current_year[i]--;
                            }
                            this.set_date(this.current_date[i], 'month', this.current_month[i]);
                            this.set_date(this.current_date[i], 'year', this.current_year[i]);
                        } else {
                            return false;
                        }
                        this.date_update();
                        this.manage_views(i);  
                    } 
                }
                
            } else {
                return false;
            }
        },

        next: function(j) {
            if (!$(this).hasClass(this.namespace + '-blocked')) {
                if (this.options.mode !== 'multiple') {
                    if (this.view[j] === 'days') {
                        if (++this.current_month[j] === 12) {
                            this.current_month[j] = 0;
                            this.current_year[j]++;
                        }
                        this.set_date(this.current_date[j], 'month', this.current_month[j]);
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    } else if (this.view[j] === 'months') {
                        this.current_year[j]++;
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    } else if (this.view[j] === 'years') {
                        this.current_year[j] += 12;
                        this.set_date(this.current_date[j], 'year', this.current_year[j]);
                    }
                    
                    this.date_update();
                    this.manage_views(j);
                } else {                              
                    for (var i = 0; i < this.options.calendars; i++) {
                        if (this.view[i] === 'days') {
                            if (++this.current_month[i] === 12) {
                                this.current_month[i] = 0;
                                this.current_year[i]++;
                            }
                            this.set_date(this.current_date[i], 'month', this.current_month[i]);
                            this.set_date(this.current_date[i], 'year', this.current_year[i]);
                        } else {
                            return false;
                        }
                        this.date_update();
                        this.manage_views(i);  
                    }
                }
            } else {
                return false;
            }
        },

        caption: function(j) {
            if(this.options.mode !== 'multiple') {
                if (this.view[j] === 'days') {
                    this.view[j] = 'months';
                } else if (this.view[j] === 'months') {
                    this.view[j] = 'years';
                } else {
                    return false;
                }
            } else {
                return false;
            }


            this.date_update();
            this.manage_views(j);
        },
        click: function(e) {
            var target = $(e.target).closest('td, span');
            var get_place = function(array, obj) {
                var j;
                $.each(array, function(i, val) {
                    if (val === obj) {
                        j = i;
                    }
                });
                return j;
            };
            if (target.length === 1) {
                var current_cal = target.parent().parent().parent().parent(),
                    current_cal_head = target.parent().parent(),
                    i = get_place(this.calendar, current_cal.get(0)),
                    i_head = get_place(this.calendar, current_cal_head.get(0));

                switch (target[0].nodeName.toLowerCase()) {
                    case 'span':
                        switch (target[0].className) {
                            case this.namespace + '-caption':
                                this.caption(i_head);
                                break;
                            case this.namespace + '-prev':
                                this.prev(i_head);
                                break;
                            case this.namespace + '-next':
                                this.next(i_head);
                                break;
                        }
                        break;
                    case 'td':
                        var type = target.parent().parent().parent().attr('class'),
                            judge_day = target.hasClass('otherMonthDay'),
                            judge_range = target.hasClass('is-untouchable'),
                            self = this;

                        switch (type) {
                            case this.namespace + '-days':
                                if (judge_day === false && judge_range === false) {
                                    var day = parseInt(target.text(), 10);
                                    this.set_date(this.selected_date[i], 'day', day);
                                    this.set_date(this.current_date[i], 'day', day);
                                    this.set_date(this.selected_date[i], 'month', this.current_month[i]);
                                    this.set_date(this.current_date[i], 'month', this.current_month[i]);
                                    this.set_date(this.selected_date[i], 'year', this.current_year[i]);
                                    this.set_date(this.current_date[i], 'year', this.current_year[i]);
                                    this.date_update();
                                    if(this.options.mode === 'range') {
                                        if(i === 0) {
                                            if (this.current_date[0] > this.current_date[1]) {
                                                this.set_date(this.current_date[i+1], 'month', this.current_month[i]);
                                                this.set_date(this.current_date[i+1], 'year', this.current_year[i]);
                                                this.date_update();
                                            }
                                            this.manage_views(i + 1);
                                        }else if (i === 1){
                                            if (this.current_date[0] > this.current_date[1]) {
                                                this.set_date(this.current_date[i-1], 'month', this.current_month[i]);
                                                this.set_date(this.current_date[i-1], 'year', this.current_year[i]);
                                                this.date_update();
                                            }
                                            this.manage_views(i - 1);
                                        }
                                    }else if (this.options.mode === 'multiple') {
                                        var date = Date.parse(new Date(this.current_date[i]));
                                        if ($.inArray(date, this.multiple_date) > -1) {
                                            $.each(this.multiple_date, function(nr, dat) {
                                                if (dat === date) {
                                                    self.multiple_date.splice(nr,1);
                                                    return false;
                                                }
                                            });
                                        }else {
                                            this.multiple_date.push(date);
                                        }
                                        this.manage_views(i-1);
                                        this.manage_views(i+1);
                                    }
                                    this.manage_views(i);
                                    this.set_value(i);
                                    if(this.options.mode === 'single' && this.options.alwaysShow === false) {
                                        this.hide();
                                    }
                                }else{
                                    return false;
                                }
                                break;
                            case this.namespace + '-months':
                                if (judge_day === false && judge_range === false) {
                                    this.view[i] = 'days';
                                    var match = target.attr('class').match(/month\-([0-9]+)/);
                                    var month = Number(match[1]);
                                    this.set_date(this.current_date[i], 'month', month);
                                    this.date_update();
                                    this.manage_views(i);
                                } else {
                                    return false;
                                }
                                break;
                            case this.namespace + '-years':
                                if (judge_day === false && judge_range === false) {
                                    this.view[i] = 'months';
                                    var year = parseInt(target.text(), 10);
                                    this.set_date(this.current_date[i], 'year', year);
                                    this.date_update();
                                    this.manage_views(i);
                                } else {
                                    return false;
                                }   
                                break;
                        }
                        break;
                }
            }
        }

    };


    $.fn.datepicker = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : undefined;
            if(/^(getWrap|getInput|getDate)$/.test(method)){
                var api = this.first().data('datepicker');
                if (api && typeof api[method] === 'function') {
                    return api[method].apply(api, method_arguments);
                }
            } else {
                return this.each(function() {
                    var api = $.data(this, 'datepicker');
                    if (api && typeof api[method] === 'function') {
                        api[method].apply(api, method_arguments);
                    }
                });
            }
        } 
        else {
            return this.each(function() {
                if (!$.data(this, 'datepicker')) {
                    $.data(this, 'datepicker', new Datepicker(this, options));
                }
            });
        }
    };
})(jQuery);
