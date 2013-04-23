/*
 * datepicker
 * https://github.com/amazingsurge/jquery-datepicker
 *
 * Copyright (c) 2013 amazingSurge
 * Licensed under the MIT license.
 */
(function($) {

    var Datepicker = $.daypicker = function(element, options) {
        var self = this;
        self.el = $(element);
        var el = self.el;
        self.options = $.extend(true, {}, Datepicker.defaults, options);
        var options = self.options;
        self.format = self.parse_format(options.format || Datepicker.defaults.format || 'mm/dd/yyyy')
        self.init();
    };

    Datepicker.defaults = {
        first_day_of_week: 1,
        days: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        months_short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        // mode: 'single',
        calendars: 2,
        date: [new Date(), new Date()],
        // date: '2000/12/12',
        mode: 'range',
        views: ['days', 'months'],
        format: 'yyyy/mm/dd',
        tpl_wrapper: '<div class="calendar-wrap">' + '</div>',
        tpl_content: '<div class="calendar">' + '<table>' + '<thead>' + '<tr class="calendar-head">' + '<th class="calendar-prev"></th>' + '<th class="calendar-caption"></th>' + '<th class="calendar-next"></th>' + '</tr>' + '</thead>' + '</table>' + '<table class="calendar-days"></table>' + '<table class="calendar-months"></table>' + '<table class="calendar-years"></table>' + '</div>'
    }

    Datepicker.prototype = {
        constructor: Datepicker,

        init: function() {
            this.picker = $(Datepicker.defaults.tpl_wrapper)
                .appendTo('body')
                .on({
                click: $.proxy(this.click, this)
            });
            this.picker.css('width', Datepicker.defaults.calendars * 205 + 'px')
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

            this.html = '';
            for (var i = 0; i < Datepicker.defaults.calendars; i++) {
                this.html += Datepicker.defaults.tpl_content;
            }
            this.picker.append(this.html);

            this.view = Datepicker.defaults.views;
            this.calendar = this.picker.find('.calendar');
            this.header = this.calendar.find('.calendar-head');
            this.daypicker = this.calendar.find('.calendar-days');
            this.monthpicker = this.calendar.find('.calendar-months');
            this.yearpicker = this.calendar.find('.calendar-years');

            this.selected_date = this.current_date = Datepicker.defaults.date;

            if (Datepicker.defaults.mode == 'single') {
                this.current_day = [this.current_date[0].getDate()];
                this.current_month = [this.current_date[0].getMonth()];
                this.current_year = [this.current_date[0].getFullYear()];

                this.selected_day = [this.selected_date[0].getDate()];
                this.selected_month = [this.selected_date[0].getMonth()];
                this.selected_year = [this.selected_date[0].getFullYear()];

                this.manage_views(0);
                this.set_value();
            } else {
                if (Datepicker.defaults.mode == 'range') {
                    Datepicker.defaults.date[1] = new Date(Datepicker.defaults.date[1]);

                    this.current_day = [this.current_date[0].getDate(), this.current_date[1].getDate()];
                    this.current_month = [this.current_date[0].getMonth(), this.current_date[1].getMonth()];
                    this.current_year = [this.current_date[0].getFullYear(), this.current_date[1].getFullYear()];

                    this.selected_day = [this.selected_date[0].getDate(), this.selected_date[1].getDate()];
                    this.selected_month = [this.selected_date[0].getMonth(), this.selected_date[1].getMonth()];
                    this.selected_year = [this.selected_date[0].getFullYear(), this.selected_date[1].getFullYear()];

                    this.set_value();
                }

                for (var i = 0; i < Datepicker.defaults.calendars; i++) {
                    // Datepicker.defaults.date[i] = Datepicker.defaults.date[i];
                    if (typeof(this.view[i]) == 'undefined') {
                        this.view[i] = 'days';
                    }
                    this.manage_views(i);
                }

            }

            this.manage_views();
        },

        show: function() {
            this.picker.show();
            this.place();
            var self = this;

            $(window).scroll(function() {
                self.place();
            })

            $(document).on('mousedown', function(ev) {
                if ($(ev.target).closest('.calendar').length == 0) {
                    self.hide();
                }
            });

        },

        hide: function() {
            this.picker.hide();
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
                scroll_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            scroll_left = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
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
            if (Datepicker.defaults.mode == 'single') {
                this.date = new Date(this.selected_year[0], this.selected_month[0], this.selected_day[0], 0, 0, 0, 0);
                var formated = this.format_date(this.date, this.format);
                this.el.val(formated);
            } else {
                if (Datepicker.defaults.mode == 'range') {
                    var date_start = new Date(this.selected_year[0], this.selected_month[0], this.selected_day[0], 0, 0, 0, 0);
                    var date_end = new Date(this.selected_year[1], this.selected_month[1], this.selected_day[1], 0, 0, 0, 0);
                    var formated_start = this.format_date(date_start, this.format);
                    var formated_end = this.format_date(date_end, this.format);
                    this.el.val(formated_start + ' - ' + formated_end);
                }
            }
        },

        str_pad: function(str, len) {
            str += '';
            while (str.length < len) str = '0' + str;
            return str;
        },

        str_concat: function() {
            var str = '';
            for (var i = 0; i < arguments.length; i++) str += (arguments[i] + '');
            return str;
        },

        parse_format: function(format) {
            var separator = format.match(/[.\/\-\s].*?/),
                parts = format.split(/\W+/) || parts;
            if (!parts || parts.length === 0) {
                throw new Error('Invalid date format.')
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
            var date = [];
            for (var i = 0, length = format.parts.length; i < length; i++) {
                date.push(val[format.parts[i]]);
            }
            return date.join(format.separator);
        },

        generate_daypicker: function(j) {
            var
            days_in_month = new Date(this.selected_year[j], this.selected_month[j] + 1, 0).getDate(),
                first_day = new Date(this.selected_year[j], this.selected_month[j], 2).getDay(),
                days_in_prev_month = new Date(this.selected_year[j], this.selected_month[j], 0).getDate(),
                days_from_prev_month = first_day - Datepicker.defaults.first_day_of_week,
                html = '<thead>' + '<tr class="calendar-week">';

            days_from_prev_month = days_from_prev_month < 0 ? 7 + days_from_prev_month : days_from_prev_month;

            this.manage_header(Datepicker.defaults.months[this.selected_month[j]] + ' ' + this.selected_year[j], j);

            for (var i = 0; i < 7; i++) {
                html += '<th>' + Datepicker.defaults.days[i] + '</th>';
            }
            html += '</tr>' + '</thead>';
            html += '<tbody>' + '<tr>';

            for (var i = 0; i < 42; i++) {
                if (i > 0 && i % 7 == 0) {
                    html += '</tr><tr>';
                };
                var day = (i - days_from_prev_month + 1);

                if (i < days_from_prev_month) {
                    html += '<td class="otherMonthDay">' + (days_in_prev_month - days_from_prev_month + i + 1) + '</td>';
                } else if (day > days_in_month) {
                    html += '<td class="otherMonthDay">' + (day - days_in_month) + '</td>';
                } else {
                    if (this.selected_month[j] == this.current_month[j] && this.selected_year[j] == this.current_year[j] && this.current_day[j] == day) {
                        html += '<td class="is-active">' + day + '</td>';
                    } else {
                        html += '<td>' + day + '</td>';
                    }
                }
            }

            this.daypicker.eq(j).html(html);
        },

        generate_monthpicker: function(j) {
            this.manage_header(this.selected_year[j], j);
            var html = '<tr>';
            for (var i = 0; i < 12; i++) {
                if (i > 0 && i % 3 == 0) {
                    html += '</tr><tr>';
                }
                if (i == this.current_month[j] && this.selected_year[j] == this.current_year[j]) {
                    html += '<td class="' + 'calendar-month-' + i + ' is-active">' + Datepicker.defaults.months_short[i] + '</td>';
                } else {
                    html += '<td class="' + 'calendar-month-' + i + '">' + Datepicker.defaults.months_short[i] + '</td>';
                }
            }
            html += '</tr>';
            this.monthpicker.eq(j).html(html);
        },

        generate_yearpicker: function(j) {
            this.manage_header(this.selected_year[j] - 7 + ' - ' + (this.selected_year[j] + 4), j);
            var html = '<tr>';
            for (var i = 0; i < 12; i++) {
                if (i > 0 && i % 3 == 0) {
                    html += '</tr><tr>';
                }
                if ((this.selected_year[j] - 7 + i) == this.current_year[j]) {
                    html += '<td class="is-active">' + (this.selected_year[j] - 7 + i) + '</td>';
                } else {
                    html += '<td>' + (this.selected_year[j] - 7 + i) + '</td>';
                }
            }
            html += '</tr>';
            this.yearpicker.eq(j).html(html);
        },

        manage_header: function(caption, j) {
            this.calendar.eq(j).find('.calendar-caption').html(caption);

            var year = this.selected_year[j],
                month = this.selected_month[j],
                next, previous;

            if (this.view == 'days') {
                previous = (month - 1 < 0 ? this.str_concat(year - 1, '11') : this.str_concat(year, this.str_pad(month - 1, 2)));
                next = (month + 1 > 11 ? this.str_concat(year + 1, '00') : this.str_concat(year, this.str_pad(month + 1, 2)));
            } else if (this.view == 'months') {
                previous = year - 1;
                next = year + 2;
            } else if (this.view == 'years') {
                previous = year - 7;
                next = year + 7;
            }
        },

        manage_views: function(j) {
            if (this.view[j] == 'days') {
                this.generate_daypicker(j);
                this.daypicker.eq(j).css('display', 'inline-block');
                this.monthpicker.eq(j).hide();
                this.yearpicker.eq(j).hide();

            } else if (this.view[j] == 'months') {
                this.generate_monthpicker(j);
                this.daypicker.eq(j).hide();
                this.monthpicker.eq(j).css('display', 'inline-block');;
                this.yearpicker.eq(j).hide();

            } else if (this.view[j] == 'years') {
                this.generate_yearpicker(j);
                this.daypicker.eq(j).hide();
                this.monthpicker.eq(j).hide();;
                this.yearpicker.eq(j).css('display', 'inline-block');
            }
        },

        prev: function(j) {
            if (!$(this).hasClass('calendar-blocked')) {
                if (this.view[j] == 'months') {
                    this.selected_year[j]--;
                } else if (this.view[j] == 'years') {
                    this.selected_year[j] -= 12;
                } else if (--this.selected_month[j] < 0) {
                    this.selected_month[j] = 11;
                    this.selected_year[j]--;
                }
                this.manage_views(j);
            }
        },

        next: function(j) {
            if (!$(this).hasClass('calendar-blocked')) {
                if (this.view[j] == 'months') {
                    this.selected_year[j]++;
                } else if (this.view[j] == 'years') {
                    this.selected_year[j] += 12;
                } else if (++this.selected_month[j] == 12) {
                    this.selected_month[j] = 0;
                    this.selected_year[j]++;
                }
                this.manage_views(j);
            }
        },

        caption: function(j) {
            if (this.view[j] == 'days') {
                this.view[j] = 'months';
            } else if (this.view[j] == 'months') {
                this.view[j] = 'years';
            } else {
                return false;
            }
            this.manage_views(j);
        },
        click: function(e) {
            var target = $(e.target).closest('td, th');
            var get_place = function(array, obj) {
                var j;
                $.each(array, function(i, val) {
                    if (val == obj) {
                        j = i;
                    }
                })
                return j;
            };
            if (target.length === 1) {
                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        var current_cal = target.parent().parent().parent().parent();
                        switch (target[0].className) {
                            case 'calendar-caption':
                                var i = get_place(this.calendar, current_cal.get(0));
                                this.caption(i);
                                break;
                            case 'calendar-prev':
                                var i = get_place(this.calendar, current_cal.get(0));
                                this.prev(i);
                                break;
                            case 'calendar-next':
                                var i = get_place(this.calendar, current_cal.get(0));
                                this.next(i);
                                break;
                        }
                        break;
                    case 'td':
                        var type = target.parent().parent().parent().attr('class');
                        var current_day = target.attr('class');
                        var current_cal = target.parent().parent().parent().parent();
                        switch (type) {
                            case 'calendar-days':
                                if (current_day !== 'otherMonthDay') {
                                    var i = get_place(this.calendar, current_cal.get(0));
                                    var day = parseInt(target.text(), 10);
                                    this.selected_day[i] = day;
                                    this.current_day[i] = this.selected_day[i];
                                    this.current_month[i] = this.selected_month[i];
                                    this.current_year[i] = this.selected_year[i];
                                    this.manage_views(i);
                                    this.set_value(i);
                                }
                                break;
                            case 'calendar-months':
                                var i = get_place(this.calendar, current_cal.get(0));
                                var match = target.attr('class').match(/calendar\-month\-([0-9]+)/);
                                this.selected_month[i] = Number(match[1]);
                                this.current_month[i] = this.selected_month[i];
                                this.current_year[i] = this.selected_year[i];
                                this.view[i] = 'days';
                                this.manage_views(i);
                                this.set_value(i);
                                break;
                            case 'calendar-years':
                                var i = get_place(this.calendar, current_cal.get(0));
                                var year = parseInt(target.text(), 10);
                                this.view[i] = 'months';
                                this.selected_year[i] = year;
                                this.current_year[i] = this.selected_year[i];
                                this.manage_views(i);
                                this.set_value(i);
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
    }

})(jQuery);
