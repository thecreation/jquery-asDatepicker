/*
 * datepicker
 * https://github.com/amazingsurge/jquery-datepicker
 *
 * Copyright (c) 2013 amazingSurge
 * Licensed under the MIT license.
 */
(function($) {

    var Datepicker = $.daypicker = function(element, options) {
        this.el = $(element);
        this.options = $.extend(true, {}, Datepicker.defaults, options);
        this.format = this.parse_format(this.options.format || 'mm/dd/yyyy');
        this.init();
    };

    Datepicker.defaults = {
        first_day_of_week: 1,

        week_days: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        months_short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        
        // mode: 'single',
        calendars: 2,
        // date: [new Date()],
        // date: '2000/12/12',
        mode: 'range',
        language: 'english', //'chinese'
        views: ['days', 'days'],
        format: 'yyyy/mm/dd',
        tpl_wrapper: '<div class="calendar-wrap">' + '</div>',
        tpl_content: '<div class="calendar">' + 
                        '<table>' + 
                            '<thead>' + 
                                '<tr class="calendar-head">' + 
                                    '<th class="calendar-prev"></th>' + 
                                    '<th class="calendar-caption"></th>' + 
                                    '<th class="calendar-next"></th>' + 
                                '</tr>' + 
                            '</thead>' + 
                        '</table>' + 
                        '<table class="calendar-days"></table>' + 
                        '<table class="calendar-months"></table>' + 
                        '<table class="calendar-years"></table>' + 
                     '</div>'
    };

    Datepicker.prototype = {
        constructor: Datepicker,

        init: function() {
            var html = '';

            this.picker = $(this.options.tpl_wrapper)
                .appendTo('body')
                .on({
                click: $.proxy(this.click, this)
            });

            this.is_input = this.el.is('input');

            if (this.is_input) {
                this._input = this.el;
                this.el.on({
                    focus: $.proxy(this.show, this)
                    // ,
                    // keyup: $.proxy(this.update, this)
                });
            } else {
                this._input = '';
            }

            if (this.options.mode === 'single') {
                html += this.options.tpl_content;
            }else {
                for (var i = 0; i < this.options.calendars; i++) {
                    html += this.options.tpl_content;
                }
            }
            

            this.picker.append(html);

            this.view = this.options.views;
            this.calendar = this.picker.find('.calendar');
            this.calendar_prev = this.calendar.find('.calendar-prev');
            this.calendar_next = this.calendar.find('.calendar-next');
            this.daypicker = this.calendar.find('.calendar-days');
            this.monthpicker = this.calendar.find('.calendar-months');
            this.yearpicker = this.calendar.find('.calendar-years');

            var calendar_width = this.calendar.outerWidth();
            this.picker.css('width', this.options.calendars * calendar_width + 'px');

            this.selected_date = [new Date()];
            this.current_date = [new Date()];

            if (this.options.mode === 'range') {
                this.current_date[1] = new Date();
                this.selected_date[1] = new Date();
                this.current_date[0].setHours(0,0,0,0);
                this.current_date[1].setHours(0,0,0,0);
                this.selected_date[0].setHours(0,0,0,0);
                this.selected_date[1].setHours(0,0,0,0);
            }

            this.date_update();

            if (this.options.mode === 'single') {
                this.manage_views(0);
            }else {
                for (var i=0; i<this.options.calendars; i++) {
                    this.manage_views(i);
                }
            }
            
            this.set_value();
        },

        show: function() {
            
            this.picker.fadeIn("normal");
            this.picker.show();

            this.place();

            var self = this;
            $(window).scroll(function() {
                self.place();
            });

            $(document).on('mousedown', function(ev) {
                if ($(ev.target).closest('.calendar').length === 0 && $(ev.target).closest(self.el).length === 0) {
                    self.hide();
                }
            });
        },

        hide: function() {
            var self = this;
            this.picker.fadeOut("normal", function () {
                self.picker.hide();
            });
        },

        place: function() {
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

            if (to_bottom > calendar_height) {
                if (to_right > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top + input_height
                    });
                } else if (to_left > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left + input_width - calendar_width,
                        "top": to_top + input_height
                    });
                } else {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top + input_height
                    });
                }
            } else if (to_top > calendar_height) {
                if (to_right > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top - calendar_height
                    });
                } else if (to_left > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left + input_width - calendar_width,
                        "top": to_top - calendar_height
                    });
                } else {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top - calendar_height
                    });
                }
            } else {
                if (to_right > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top + input_height
                    });
                } else if (to_left > calendar_width - input_width) {
                    this.picker.css({
                        "left": to_left + input_width - calendar_width,
                        "top": to_top + input_height
                    });
                } else {
                    this.picker.css({
                        "left": to_left,
                        "top": to_top + input_height
                    });
                }
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
                val;
            date = new Date();
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
                            date.setDate(val - 1);
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
                if (this.options.mode === 'range') {
                    this.current_day = [this.current_date[0].getDate(), this.current_date[1].getDate()];
                    this.current_month = [this.current_date[0].getMonth(), this.current_date[1].getMonth()];
                    this.current_year = [this.current_date[0].getFullYear(), this.current_date[1].getFullYear()];

                    this.selected_day = [this.selected_date[0].getDate(), this.selected_date[1].getDate()];
                    this.selected_month = [this.selected_date[0].getMonth(), this.selected_date[1].getMonth()];
                    this.selected_year = [this.selected_date[0].getFullYear(), this.selected_date[1].getFullYear()];
                }
            }
        },

        generate_daypicker: function(j) {
             var
                days_in_month = new Date(this.current_year[j], this.current_month[j] + 1, 0).getDate(),
                first_day = new Date(this.current_year[j], this.current_month[j], 2).getDay(),
                days_in_prev_month = new Date(this.current_year[j], this.current_month[j], 0).getDate(),
                days_from_prev_month = first_day - this.options.first_day_of_week,
                html = '<thead>' + '<tr class="calendar-week">';

            if (this.options.mode === 'range') {
                var current_start = this.current_date[0],
                    current_end = this.current_date[1],
                    selected_start = this.selected_date[0],
                    selected_end = this.selected_date[1],
                    date_array = [];

                if (j>0) {
                    if (this.current_year[j] === this.selected_year[j-1]) {
                        if(this.current_month[j] <= this.selected_month[j-1]){
                           this.calendar_prev.eq(j).addClass('calendar-blocked'); 
                        }else if(this.calendar_prev.eq(j).hasClass('calendar-blocked') === true) {
                            this.calendar_prev.eq(j).removeClass('calendar-blocked');
                        }  
                    } else if(this.calendar_prev.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_prev.eq(j).removeClass('calendar-blocked');
                    }   
                } else {
                    if (this.current_year[j] === this.selected_year[j+1]) {
                        if(this.current_month[j] >= this.selected_month[j+1]){
                           this.calendar_next.eq(j).addClass('calendar-blocked'); 
                        }else if(this.calendar_next.eq(j).hasClass('calendar-blocked') === true) {
                            this.calendar_next.eq(j).removeClass('calendar-blocked');
                        }
                    } else if(this.calendar_next.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_next.eq(j).removeClass('calendar-blocked');
                    }
                }
            }

            days_from_prev_month = days_from_prev_month < 0 ? 7 + days_from_prev_month : days_from_prev_month;

            this.manage_header(this.options.months[this.current_month[j]] + ' ' + this.current_year[j], j);

            for (var i = 0; i < 7; i++) {
                html += '<th>' + this.options.week_days[i] + '</th>';
            }
            html += '</tr>' + '</thead>';
            html += '<tbody>' + '<tr>';

            for (i = 0; i < 42; i++) { 
                var day = (i - days_from_prev_month + 1);

                if (i > 0 && i % 7 === 0) {
                    html += '</tr><tr>';
                }

                if (this.options.mode === 'single') {
                    if (i < days_from_prev_month) {
                        html += '<td class="otherMonthDay">' + (days_in_prev_month - days_from_prev_month + i + 1) + '</td>';
                    } else if (day > days_in_month) {
                        html += '<td class="otherMonthDay">' + (day - days_in_month) + '</td>';
                    } else {
                        if (day === this.selected_day[j]) {
                            html += '<td class="is-active">' + day + '</td>';
                        } else {
                            html += '<td>' + day + '</td>';
                        }
                    }
                } else {
                    if (this.options.mode === 'range') {
                        var class_name = '';
                        var content = 0;

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
                                }
                            }else if (j===1) {
                                if (Date.parse(date_array[i]) == Date.parse(selected_end)) {
                                    class_name += ' is-active';
                                } else if (date_array[i] >= selected_start && date_array[i] < selected_end) {
                                    class_name += ' in-range';
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
                            content = day;
                        }
                        if (date_array[i] === selected_start) {

                        }
                        html += '<td class="' + class_name + '">' + content + '</td>';
                    }
                }            
            }
            html += '</tr>';
            this.daypicker.eq(j).html(html); 
        },

        generate_monthpicker: function(j) {
            this.manage_header(this.current_year[j], j);
            var content =  this.options.months_short;

            if (this.options.mode === 'range'){
                var current_start = new Date (this.current_date[0].getFullYear(), this.current_date[0].getMonth(),1, 0, 0, 0, 0),
                    current_end = new Date (this.current_date[1].getFullYear(), this.current_date[1].getMonth(),1, 1, 0, 0, 0),
                    selected_start =new Date (this.selected_date[0].getFullYear(), this.selected_date[0].getMonth(),1, 0, 0, 0, 0),
                    selected_end = new Date (this.selected_date[1].getFullYear(), this.selected_date[1].getMonth(),1, 0, 0, 0, 0),
                    date_array = [];

                if (j>0) {
                    if (this.current_year[j] === this.selected_year[j-1]) {
                           this.calendar_prev.eq(j).addClass('calendar-blocked');   
                    } else if(this.calendar_prev.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_prev.eq(j).removeClass('calendar-blocked');
                    }   
                } else {
                    if (this.current_year[j] === this.selected_year[j+1]) {
                           this.calendar_next.eq(j).addClass('calendar-blocked'); 
                    } else if(this.calendar_next.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_next.eq(j).removeClass('calendar-blocked');
                    }
                }
            }

            var html = '<tr>';
            for (var i = 0; i < 12; i++) {
                if (i > 0 && i % 3 === 0) {
                    html += '</tr><tr>';
                }
                if (this.options.mode === 'single') {
                    if (i === this.current_month[j] && this.selected_year[j] === this.current_year[j]) {
                        html += '<td class="' + 'calendar-month-' + i + ' is-active">' + content[i] + '</td>';
                    } else {
                        html += '<td class="' + 'calendar-month-' + i + '">' + content[i] + '</td>';
                    }
                } else {
                    if (this.options.mode === 'range') {
                        var class_name = 'calendar-month-' + i;
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

                        html += '<td class="' + class_name + '">' + content[i] + '</td>';
                    }
                }
                
            }
            html += '</tr>';
            this.monthpicker.eq(j).html(html);
        },

        generate_yearpicker: function(j) {
            this.manage_header(this.current_year[j] - 7 + ' - ' + (this.current_year[j] + 4), j);

            if (this.options.mode === 'range'){
                var current_start = this.current_date[0].getFullYear(),
                    current_end = this.current_date[1].getFullYear(),
                    selected_start = this.selected_date[0].getFullYear(),
                    selected_end = this.selected_date[1].getFullYear();

                if (j>0) {
                    if ((this.current_year[j] - 7) <= this.selected_year[j-1]) {
                           this.calendar_prev.eq(j).addClass('calendar-blocked');   
                    } else if(this.calendar_prev.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_prev.eq(j).removeClass('calendar-blocked');
                    }   
                } else {
                    if ((this.current_year[j] + 4) >= this.selected_year[j+1]) {
                           this.calendar_next.eq(j).addClass('calendar-blocked'); 
                    } else if(this.calendar_next.eq(j).hasClass('calendar-blocked') === true) {
                        this.calendar_next.eq(j).removeClass('calendar-blocked');
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

                    if ((this.current_year[j] - 7 + i) === this.current_year[j]) {
                        html += '<td class="is-active">' + (this.current_year[j] - 7 + i)+ '</td>';
                    } else {
                        html += '<td>' + (this.current_year[j] - 7 + i) + '</td>';
                    }
                } else {
                    if (this.options.mode === 'range') {
                        var class_name = '';

                        if (j > 0) {
                            if (year === selected_end) {
                                class_name += ' is-active';
                            } else if (year < selected_start){
                                class_name += ' is-untouchable';
                            } else if (year < selected_end && year >= selected_start) {
                                class_name += ' in-range';
                            }
                        } else {
                            if (year === selected_start) {
                                class_name += ' is-active';
                            } else if (year > selected_end) {
                                class_name += ' is-untouchable';
                            } else if (year <= selected_end && year > selected_start) {
                                class_name += ' in-range';
                            }
                        }

                        html += '<td class="' + class_name + '">' + year + '</td>';
                    }
                }
                
            }
            html += '</tr>';
            this.yearpicker.eq(j).html(html);
        },

        manage_header: function(caption, j) {
            this.calendar.eq(j).find('.calendar-caption').html(caption);
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
            if (!$(this).hasClass('calendar-blocked')) {
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
                return false;
            }
        },

        next: function(j) {
            if (!$(this).hasClass('calendar-blocked')) {
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
                return false;
            }
        },

        caption: function(j) {
            if (this.view[j] === 'days') {
                this.view[j] = 'months';
            } else if (this.view[j] === 'months') {
                this.view[j] = 'years';
            } else {
                return false;
            }

            this.date_update();
            this.manage_views(j);
        },
        click: function(e) {
            var target = $(e.target).closest('td, th');
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
                    i = get_place(this.calendar, current_cal.get(0));

                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'calendar-caption':
                                this.caption(i);
                                break;
                            case 'calendar-prev':
                                this.prev(i);
                                break;
                            case 'calendar-next':
                                this.next(i);
                                break;
                        }
                        break;
                    case 'td':
                        var type = target.parent().parent().parent().attr('class'),
                            judge_day = target.hasClass('otherMonthDay'),
                            judge_range = target.hasClass('is-untouchable');

                        switch (type) {
                            case 'calendar-days':
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
                                    }
                                    this.manage_views(i);
                                    this.set_value(i);
                                }else{
                                    return false;
                                }
                                break;
                            case 'calendar-months':
                                if (judge_day === false && judge_range === false) {
                                    this.view[i] = 'days';
                                    var match = target.attr('class').match(/calendar\-month\-([0-9]+)/);
                                    var month = Number(match[1]);
                                    this.set_date(this.current_date[i], 'month', month);
                                    this.date_update();
                                    this.manage_views(i);
                                } else {
                                    return false;
                                }
                                break;
                            case 'calendar-years':
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
        var pluginName = 'datepicker';
        var instance = this.data(pluginName);
        if (!instance) {
            return this.each(function() {
                return $(this).data(pluginName, new Datepicker(this, options));
            });
        }
        return (options === true) ? instance : this;
    };

})(jQuery);
