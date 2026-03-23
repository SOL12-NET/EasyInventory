export default {

	// WARNINGS:
	// * setting restart_if_needed() to automatic would prevent Pages/Main to complete loading.
	//
	
	photosShow : false,
	photosLoaded : null,
	photoSelected : null,
	resultsShow : false,
	selectedItem : null,
	selectedItemCard : null,
	
	//
	i18n(key) {
		return appsmith.store?.i18n_d?.[key] || key;
	},

	capitalizeI18n(key) {
		const text = this.i18n(key);
		return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
	},
	
	restart_if_needed() {
		if (!appsmith.store.search)
			navigateTo("init");
	},

	//
	jwtGetExpiry(token) {
		try {
			return JSON.parse(atob(token.split('.')[1])).exp;  
		} catch (error) {
			console.error('Error decoding token:', error);
			return null; 
		}
	},
	
	async jwtRefresh() {
		showAlert("refreshing DB connection");

		const result = await qAuthRefresh.run();	// see query body
		const expiry = this.jwtGetExpiry(result?.access_token);
		if (!isFinite(expiry) || result?.access_token === undefined)
			// just reset the session
			return navigateTo("init");	

		await storeValue('JWT', {
			access: result.access_token,
			refresh: appsmith.store.JWT.refresh,
			expiry: expiry,
		});
	},

	// runs qAuthRefresh when token is expired
  async jwtEnsure() {
		let expiry = appsmith.store?.JWT?.expiry;
		const now = Date.now()/1000;
		if (expiry === undefined || now > expiry) {
			await this.jwtRefresh();
			expiry = appsmith.store?.JWT?.expiry;
		}
		console.log("token ttl", now - expiry);
  },
	
	async runWithAuth(query, params = {}) {
		await this.jwtEnsure();
		
		let res_data = null;
		try {
      res_data = await query.run({ payload: params });
    }
		catch (error) {
			// await console.log("runWithAuth.catch", JSON.stringify(query), e);
			await console.log("runWithAuth", error);
			throw error;
    }

		return res_data;
	},
	
	async toggleSearch() {
		const mode = (appsmith.store.search?.mode === 'tag' ? 
									appsmith.store.SEARCH_OPTIONS['TXT'] :
									appsmith.store.SEARCH_OPTIONS['TAG']);
		await storeValue('search', mode);
		return mode;
	},

	async toggleSearchModeAndRun() {
		await this.toggleSearch();
		await this.runSearch(inpSearch.text);	// reactive
	},
	
  async runSearch(text) {
		inpSearch.setDisabled(true);
		let search_results = null;
		
		try {
			const res_data = await this.runWithAuth(qSearch, {text:text || ''});
			search_results = res_data.results || [];

			this.resultsShow = true;
			this.selectOtherItem( (res_data.count === 1) ? search_results[0] : null);
		}
		catch (err) {
			 throw err;
		}
		finally {
			inpSearch.setDisabled(false);
		}

    return search_results;
  },

	updateSelectedItemCard() {
		const photoName = this.selectedItem?.photo_card;
		const url = photoName ?
					(appsmith.store.url_thumbnails + photoName) :
					null;
		this.selectedItemCard = url;
	},
	
	// sets all future edits on a specific item.
  selectOtherItem(item) {
		this.photosShow = false;
		this.photosLoaded = null;
		this.selectedItem = item;
		this.updateSelectedItemCard();
	// update category selector
		slctCategory.setSelectedOption(item?.category);
  },

	getSelectedItemBtnVariant(state) {
		return this.selectedItem?.status?.value !== state ? 'SECONDARY' : 'PRIMARY';
	},

	//
	selectPhoto(br_photo) {
		this.photoSelected = br_photo;
	},
	
	getItemAction(created_action) {
		return {
			last_action : created_action.value.value,
			last_action_by: created_action.actor,
			last_action_at: created_action.at, 
		};
	},
	
	// updates an item, refreshing selectedItem from query result if refresh is true.
  async updateItem(action, query, data, refresh = false) {
    const res_ui_q = await this.runWithAuth(query, data);

		// store action
		const created_action = await this.addAction(action, refresh);
		const item_insert = this.getItemAction(created_action);
		await this.runWithAuth(qUpdateItem, item_insert);
		
		// refresh
		if (refresh === true) {
			/// should only be a single item
			// if (res_ui_q?.results?.length == 1)
			if (res_ui_q?.results?.length) {
				showAlert("query for action "+action+" has result prop.");
				this.selectedItem = res_ui_q.results[0]
			}
			this.selectedItem = res_ui_q;
		}
		return res_ui_q;
  },
	
	async setName(name) {
		if (name === this.selectedItem?.name)
			return;

		let itemPatch = { name: name };
		return await this.updateItem(
			'EDIT_NAME',
			qUpdateItem,
			itemPatch,
			true
		);
	},
	
	async setCategory(value) {
		if (value === this.selectedItem.category)
			return;
		
		const itemPatch = { category: value };
		return await this.updateItem(
			'EDIT_CATEGORY',
			qUpdateItem,
			itemPatch,
			true
		);
	},
	
	async setNotes(notes) {
		if (notes === this.selectedItem?.notes)
			return;

		let itemPatch = { notes: notes };
		return await this.updateItem(
			'EDIT_NOTES',
			qUpdateItem,
			itemPatch,
			true
		);
	},
	
  async setStatus(status) {
		if (status === this.selectedItem?.status)
			return;

		let itemPatch = { status: status };
		return await this.updateItem(
			'SET_' + String(status).toUpperCase(), 
			qUpdateItem, 
			itemPatch,
			true
		);
  },
	
	async toggleShowPhotos() {
		this.photosShow = !this.photosShow;

		// check if we need to load new photos
		if (this.photosShow && this.photosLoaded !== this.selectedItem.id) {
			const res_data = await this.runWithAuth(qGetPhotos);
			if (res_data !== undefined)
				this.photosLoaded = this.selectedItem.id;
		}
	},
	
	async uploadFile(file_from_FilePicker) {
		// Before a file can be added to a row in Baserow, it has to be uploaded to the Files endpoint.
		// The API will return a unique identifier for the new file, which can then be inserted into an existing row.
		if (!file_from_FilePicker?.name || !file_from_FilePicker?.data)
		  throw new Error("Invalid Appsmith file object");
		
		const out = { ok: {}, ko: {} };
		try {
			const res_data = await this.updateItem(
				'NEW_UPLOAD',
				qUploadFile,
				{file : file_from_FilePicker}
			);
				
			if (res_data?.name && res_data?.original_name)
				out.ok[res_data.original_name] = res_data.name;
		}
		catch(e){
			out.ko[file_from_FilePicker.name] = e;
		}
		return out;
	},
	
	async uploadFilesParallel(files) {
    const settled = await Promise.allSettled(
      files.map(async (f) => {
				
        try {
          const res_data = await this.updateItem(
						'NEW_UPLOAD', 
						qUploadFile, 
						{ file: f }
					);
          const original = res_data?.original_name;
          const generated = res_data?.name;

					// trust no one..
          if (!original || !generated) {
            throw {
              originalName: f.name,
              message: "Upload succeeded but response missing original_name/name",
              raw: res_data,
            };
          }
          return { original, generated };
        } 
				catch (err) {
          // ensure we can key KO by something deterministic
          const originalName = err?.originalName ?? f.name;
          const message =
            err?.message ??
            err?.data?.message ??
            err?.response?.data?.error ??
            err?.toString?.() ??
            "Unknown error";
          throw { original: originalName, message };
        }
      })
    );

		// tidy results
		const out = { ok: {}, ko: {} };
    for (const s of settled) {
      if (s.status === "fulfilled") {
        out.ok[s.value.original] = s.value.generated;
      } else {
        out.ko[s.reason.original] = s.reason.message;
      }
    }

    return out;
  },
	
	// upload, link and log addition of (new) photo.
	async uploadPhotos() {
		const src_files = fpAddPhotos.files;
		if (!src_files?.length) 
			return;
			
		const results = await (src_files.length > 1 ?
								this.uploadFilesParallel(src_files) :
								this.uploadFile(src_files[0])
		);
		// any KO report is a failure
		if (Object.keys(results.ko).length > 0) {
			const firstErr = Object.entries(results.ko)[0];
			return showAlert(this.i18n("Error uploading file", firstErr?.[0], firstErr?.[1]));
		}
		
		// check the file hasn't been linked before
		const to_link = Object.values(results.ok).filter(
			(br_name) => {
				const exists = qGetPhotos.data.results.some((qgp) => qgp.photo === br_name);
				return !exists
			}
		);
		
		// link all at once
		const settled = await Promise.allSettled(
			to_link.map( (br_name_photo) => this.linkPhotoToItem(br_name_photo))
		);
		for (const s of settled) {
			if (s.status !== "fulfilled")
				return showAlert(this.i18n("Error attributing photo to item"));
		}
			
		// reload photos (no need to settle)
		qGetPhotos.run();
	},
		
	async linkPhotoToItem(br_name) {
		const name = br_name || appsmith.store.selectedPhoto?.name || '';		//SEE: imgPhoto
		
		// Add file to a row
		const photoInsert = {
			Active: true,
			photo: name,	// as string
			file: name,
			location: appsmith.store.location,
			taken_on: new Date().toISOString(),
			taken_by: appsmith.store.userRole,
			item: this.selectedItem.id
		};
		return await this.updateItem(
			'PHOTO_LINK', 
			qInsertPhotoRow, 
			photoInsert,
		);
	},
	
	async setPhotoObsolete(br_photo) {
		const photo = br_photo || this.photoSelected;
		if (!photo?.id)
			throw new Error("invalid photo");

		const name = photo?.photo || '';
		const card = this.selectedItem?.photo_card || '';

		// update Card if 
		if (card && name && card === name) {
			const itemPatch = { photo_card: "" };
			//TODO: use next available photo
			const item = await this.runWithAuth(qUpdateItem, itemPatch);
			this.selectedItem = item;
			this.updateSelectedItemCard();
		}
		// set photo obsolete	
		const photoPatch = { id: photo.id, Active: false };
		await this.updateItem(
			'PHOTO_UNLINK',
			qUpdatePhoto,
			photoPatch,
		);
		return await qGetPhotos.run();
  },
	
  async setPhotoFront(br_photo) {
		// also: br_photo as null => remove front
		const photo = br_photo || this.photoSelected;
		const itemPatch = { photo_card: photo.photo };
		
		await this.updateItem(
			'PHOTO_FRONT',
			qUpdateItem,
			itemPatch,
			true
		);
		this.updateSelectedItemCard();
  },
	
	async addAction(action) {
		// add action to history, and update item last_action
		const action_insert = {
      value: action,
      actor: appsmith.store.userRole,
      at: new Date().toISOString(),
			item: this.selectedItem?.id,
    };
    const resolution = await this.runWithAuth(qInsertAction, action_insert);
		return resolution;
	},
	
	async addItem() {
		// create action
		const action_create = await this.addAction('NEW_ITEM');
		if (!action_create?.id)
			throw new Error("cannot create action.NEW_ITEM");

		// create item
		const item_action = this.getItemAction(action_create);
		const item_default = { 
			name: "",
			location: appsmith.store.location,
			status: 'AVAILABLE',
		}
		const new_item = await this.runWithAuth(
			qInsertItem, 
			{ ...item_action, ...item_default }
		);
		if (!new_item?.id)
			throw new Error("cannot create item");
		
		this.selectOtherItem(new_item);
		this.resultsShow = false;
  },

};
