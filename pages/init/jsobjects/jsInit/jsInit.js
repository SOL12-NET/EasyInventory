export default {
	BASEROW_HOSTS : {
		local: 'http://localhost:8080',
		prod: 'https://baserow.manymakers.net',
	},
	WORKSPACE_NAME: 'RentalMVP',
	DATABASE_NAME: 'RentalMVP',
	BASEROW_AUTH : {
		local: {
			email: 'admin@example.com',
			password: 'change_me_admin',
		},
		prod: {
			email: 'jwt@itemgr.manymakers.fr',
			password: '>Ç¶ÒÍ`Pïe+Ò)ë@:x±N5Q9¥÷à¬)D!gÓ',
		},
	},
	SEARCH_OPTIONS : {
		"TAG" : {
			mode: "tag",  
			icon: "tag",
			placeholder : i18n.t('home.search_placeholder_tag'),
		},
		"TXT" : {
			mode: "name",
			icon: "search-text",
			placeholder: i18n.t('home.search_placeholder_name'),
		}
	},
	CATEGORIES : [
		{ id: "Appliance" },
		{ id: "Furniture"},
		{ id: "Tool"},
		{ id: "Accessory"},
		{ id: "Other"},
	],
	completion : 0,
	text : 'Loading',
	msg : '',
		
	// 
  checkMissingFunctions() {
    try {
			if (typeof structuredClone !== "function")
				return "structuredClone";
			if (typeof moment !== "function")
				return "moment";
    } catch (e) {
			console.log(e);
      return e;
    }
  },

	jwtGetExpiry(token) {
		try {
			return JSON.parse(atob(token.split('.')[1])).exp;  
		} catch (error) {
			console.error('Error decoding token:', error);
			return null; 
		}
	},

	isLocalRuntime() {
		try {
			const hostname = (
				appsmith?.URL?.hostname ||
				window?.location?.hostname ||
				''
			).toLowerCase();
			return hostname === 'localhost' || hostname === '127.0.0.1';
		} catch (error) {
			console.warn('Could not resolve runtime hostname for qAuth', error);
			return false;
		}
	},

	getAuthPayload() {
		return this.isLocalRuntime() ? this.BASEROW_AUTH.local : this.BASEROW_AUTH.prod;
	},

	getBaserowURL() {
		return this.isLocalRuntime() ? this.BASEROW_HOSTS.local : this.BASEROW_HOSTS.prod;
	},

	findDBWorkspaceId(workspaces) {
		const name = this.WORKSPACE_NAME;
		const workspace = (workspaces || []).find((entry) => entry?.name === name);
		if (!workspace?.id)
			throw new Error(`Workspace not found: ${name}`);
		return workspace.id;
	},

	findDatabaseId(applications) {
		const name = appsmith.workspaceName;
		const database = (applications || []).find((entry) => entry?.name === name);
		if (!database?.id)
			throw new Error(`Database not found: ${name}`);
		return database.id;
	},

	buildDBInfo(workspaceId, databaseId, tables) {
		return (tables || []).reduce((acc, table) => {
			acc[table.name] = table.id;
			return acc;
		}, {
			workspace_id: workspaceId,
			database_id: databaseId,
		});
	},

	async discoverDBInfo() {
		const workspaces = await qBaserowWorkspaces.run();
		const workspaceId = this.findDBWorkspaceId(workspaces);
		const applications = await qBaserowApplications.run({ workspaceId });
		const databaseId = this.findDatabaseId(applications);
		const tables = await qBaserowTables.run({ databaseId });
		if (!tables)
			throw new Error("DB handshake");
		return this.buildDBInfo(workspaceId, databaseId, tables);
	},
	
	async jwtInit() {
		// baserow JWT token
		const result = await qAuthRuntime.run();
		if (result?.access_token && result?.refresh_token)
			await storeValue('JWT', {
				access: result.access_token,
				refresh: result.refresh_token, 
				expiry: this.jwtGetExpiry(result.access_token)
			});
		else
			throw new Error("DB handshake");
	},
	
	getPhotoURL(host, name, version = "orig") {
		if (name === undefined)	// empty string allowed
			throw new Error("name can be empty but not undefined");
		
		const path = {
			"orig"  : '',
			"thumb" : '/media/thumbnails/card_cover/'
		}[version];
		if (path === undefined)
			throw new Error("unknown version: " + version);
		return host + path + name;
	},
	
	// we really want full re-init when this function is called
  async init() {
		this.completion = 0;
		this.msg = "";
		
		// ensure clean store state, make i18n available across pages through store
		await clearStore();
		await storeValue('initComplete', false);

		this.completion = 10;

		// ensure browser functions
		const failed = this.checkMissingFunctions();
		if (failed)
			throw new Error ("object unavailable in this browser: "+failed);
		this.completion = 20;

		// Compute infra-specific values
		
		try {
			await this.jwtInit();
			this.completion = 30;

			await storeValue('DBIDs', await this.discoverDBInfo());
			this.completion = 40;

			// load user preferences (potentially overriden later)
			await storeValue('userRole', appsmith.store.userRole || 'operator');
			await storeValue('location', 'Samoëns');
			await storeValue('locale', 'fr');
			this.text = i18n.t("Loading");
			// await storeValue('i18n.t', i18n.t); // store can't hold a function
			await storeValue('i18n_d', i18n.get_dict(appsmith.store.locale));
			await storeValue('SEARCH_OPTIONS', this.SEARCH_OPTIONS);
			await storeValue('search', this.SEARCH_OPTIONS['TAG']);
			this.completion = 50;
			
			// translate and store CATEGORIES
			const categories_localized = this.CATEGORIES.reduce(
				(acc, category) => acc.concat( {id: category.id, name: i18n.t(category.id)} ),
				[]
			);
			await storeValue("CATEGORIES", categories_localized);
			this.completion = 60;

			// load company prefrences
			await storeValue('company', {
				URLlogo: 'http://www.locamobi.fr/wp-content/uploads/go-x/u/07fca669-8d44-4590-a1b5-c26951f1c9bf/image-342x143.png'
			})
			this.completion = 70;

			// Baserow thumbnails URL path
			await storeValue('url_thumbnails', 
											 this.getPhotoURL(this.getBaserowURL(), '', "thumb"));
			this.completion = 80;
			
			// runtime states : TODO define in the page exports?
			await storeValue('showItems', false);
			await storeValue('showPhotos', false);
			this.completion = 90;
			
			// set complete
			this.completion = 100;
			if (appsmith.mode === "PUBLISHED")
				return await navigateTo("Main", {}, "SAME_WINDOW").then(this.setInitComplete);
			else {	// "EDIT"
				this.setInitComplete();
				this.msg = "Mode: "+appsmith.mode;
			}
		} catch (e) {
			this.text = i18n.t("Sorry! 🤨");
			this.msg = i18n.t("we could not start properly! Is your connection OK?\nAnyway, we have been notified, so you can leave this page.\nYou might also refresh the page in a few minutes.");
			console.warn('Failed to initialize', e);
		}
	},
	
	async setInitComplete() {
		await storeValue('initComplete', true);
	}
};
