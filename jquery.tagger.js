(function($){

	"use strict"

	var Tagger = function( element, options ){

		this.$element	= $(element);
		this.options	= $.extend( {}, $.fn.tagger.defaults, options );
		this.taglist	= [];
		this.autocompleteopen = false;

		this.id = this.$element.attr('id');
		if( !this.id )
		{
			this.id = this.$element.attr('id', 'tagger'+new Date().getTime() ).attr('id');
		}


		this.init();
	};

	Tagger.prototype = {

		init : function(){

			this.$element.hide();

			var holder_html	= '<div class="tagger-input" id="'+this.id+'_taggerinput"';

			if( !this.options.width )
			{
				this.options.width = this.$element.css('width');
			}
			else
				this.options.width+='px';

			holder_html+= ' style="width:'+this.options.width+';"';

			if( this.$element.attr('placeholder')!='' )
			{
				this.options.placeholder = this.$element.attr('placeholder');
			}


			holder_html+= '><div class="tagger-list"></div>';
			if( this.options.interactive )
			{
				holder_html+= '<input class="tagger-fake-input" id="'+this.id+'_tag" value="" placeholder="'+this.options.placeholder+'"/>';
			}

			holder_html += '</div>';

			this.$holder = $(holder_html);

			this.$element.after( this.$holder );
			this.$fake_input	= this.$holder.find( '#'+this.id+'_tag' );



			this.$tag_list		= this.$holder.find( '.tagger-list' );

			this.$holder.on( 'click', '.remove-tag', $.proxy( this.removeTag, this ) );

			var that = this;

			if( this.options.interactive )
			{
				this.$holder.click( function(event){

					that.$fake_input.focus();
				});


				var link_events = false;
				if( this.options.autocomplete != null )
				{
					this.$fake_input.autocomplete( 
						this.options.autocomplete 
					).bind('autocompleteselect', function(ev,ui){

						//console.log('SELECT!');
						var addTag = $.proxy( that.addTag, that );
						addTag( ui.item.value, {focus:true, unique:that.options.unique} );

						that.$fake_input.val('');

						return false;
					}).bind('autocompleteopen', function(){

						that.autocompleteopen = true;

					})
					.bind('autocompleteclose', function(){
						that.autocompleteopen = false;
					});

					if( this.options.onlyAutocomplete===false )
					{
						link_events = true;
					}
				}
				else
				{
					link_events = true;
				}


				if( link_events )
				{
					// if a user tabs out of the field, create a new tag
					// this is only availably if autocomplete is not used.
					this.$fake_input.bind('blur', function(event){

						if( that.autocompleteopen===true )
						{
							that.autocompleteopen = false;
							event.stopPropagation();
							return false;
						}

						var value = that.$fake_input.val();
						if( value!='' )
						{
							if( that.options.minChars <= value.length && 
								(that.options.maxChars==0 || that.options.maxChars >= value.length ) )
							{
								var addTag = $.proxy( that.addTag, that );
								addTag( value, {focus:true, unique:(that.options.unique)} );
							}
						}
						else
						{
							that.$fake_input.val('');
						}

						event.stopPropagation();
						return false;
					});

					this.$fake_input.bind('keypress', function(event){

						if( event.which==that.options.delimiter.charCodeAt(0) || event.which==13 )
						{
							var value = that.$fake_input.val();
							event.stopPropagation();
							if( that.options.minChars <= value.length && 
								(that.options.maxChars==0 || that.options.maxChars >= value.length ) )
							{
								var addTag = $.proxy( that.addTag, that );
								addTag( value, {focus:true, unique:(that.options.unique)} );
							}

							return false;
						}
						else
						{

						}
					});
				}
			}
			else
			{
				
			}



			if( this.$element.val()!='' )
			{
				this.importTags( this.$element.val() );
			}
		},




		addTag : function( value, user_options ){

			var skip_tag	= false,
			options			= {focus:false, update_value:true, callback:true}

			$.extend( options, user_options );
			this.taglist	= this.$element.val().split( this.options.delimiter );

			if( this.taglist[0] == '' )
			{
				this.taglist = [];
			}

			value = $.trim( value );

			if( options.unique )
			{
				skip_tag = this.tagExist( value );
				if( skip_tag )
				{
					// mark fake input as not valid
				}
			}

			if( value!='' && skip_tag===false )
			{
				var that = this;
				var html = $('<span class="tagger-tag">').
							append(
								$('<span>').text( value ).append('&nbsp;&nbsp;').append( 
									'<a href="#" class="remove-tag" data-value="'+value+'" title="'+this.options.text_remove+'">×</a>')
							);

				this.$fake_input.val('');
				this.$tag_list.append( html );

				if( options.update_value )
				{
					this.taglist.push( value );
					this.$element.val( this.taglist.join( this.options.delimiter ) );
				}
			}

			//console.log( this.options.limitTags + ' vs ' + this.taglist.length );
			//console.log( this.taglist );
			if( this.options.limitTags <= this.taglist.length )
			{
				// Tag limit reached
				this.$fake_input.hide();
			}
		},


		removeTag : function( event ){

			var $a		= $(event.target),
			$span	= $a.parent().parent(),
			new_list	= [],
			value		= $a.data('value');

			$span.remove();

			for( var i=0; i<this.taglist.length; i++ )
			{
				if( this.taglist[i]!=value )
				{
					new_list.push( this.taglist[i] );
				}
			}

			this.taglist = new_list;
			this.$element.val( this.taglist.join( this.options.delimiter ) );

			if( this.options.limitTags > 0 && this.options.limitTags > this.taglist.length )
			{
				// Tag limit reached
				this.$fake_input.show();
			}

			event.stopPropagation();
			return false;
		},


		// Importa los valores
		importTags : function( values ){

			var tags = values.split( this.options.delimiter );
			for( var i=0; i<tags.length; i++ )
			{
				this.addTag( tags[i], {update_value:false} );
			}
		},


		tagExist : function( value ){
			return this.taglist.in_array( value );
		}
	}



	$.fn.tagger = function( option ){

		return this.each( function(){

			var $this = $(this),
				data = $this.data('tagger');
				//option = typeof option == 'object' && option;


			if( !data )
			{
				$this.data( 'tagger', new Tagger(this,option) );
			}

		});
	}


	$.fn.tagger.defaults = {
		autocomplete:null,
		onlyAutocomplete:false,		// Limit valid results to those returned by autocomplete.

		delimiter:',',		// Delimiter of the data sent to server
		interactive:true,	// Offer user an interactive way to insert new tags

		unique:true,
		limitTags:0, 	// Limit the number of tags selectable
		minChars:0,
		maxChars:0,		// if not provided there is no limit
		placeholder:null
	}

})(jQuery);