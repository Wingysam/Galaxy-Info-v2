local serde, net
pcall(function()
	serde = require("@lune/serde")
	net = require('@lune/net')
end)

local GalaxyInfo = { version = '0.1.3' }

local API = 'https://api.info.galaxy.casa/api/v2'

local function getProperty(instance, property)
	return instance[property]
end

local function getValue(parent, valueName, default)
	local value = parent:FindFirstChild(valueName)
	if not value then return default end
	return getProperty(value, 'Value')
end

local function httpRequest(request)
	if net then
		local response = net.request({
			url = request.Url,
			method = request.Method,
			headers = request.Headers,
			body = request.Body
		})
		return { Body = response.body }
	else
		return game:GetService('HttpService'):RequestAsync(request)
	end
end

local function jsonEncode(data)
	if serde then
		return serde.encode('json', data)
	else
		return game:GetService('HttpService'):JSONEncode(data)
	end
end

local function jsonDecode(str)
	if serde then
		return serde.decode('json', str)
	else
		return game:GetService('HttpService'):JSONDecode(str)
	end
end

function GalaxyInfo.new(token)
	local galaxyInfo = {}

	function galaxyInfo.serializeShip(ship, test)
		local function spinals()
			local function spinal(spinalModel)
				local data = {}
				
				for _, gunPart in ipairs(spinalModel:GetChildren()) do
					local gunData = {}
					
					gunData.attributes =  gunPart:GetAttributes()

					gunData.barrels = #gunPart:GetChildren()
					table.insert(data, gunData)
				end

				return data
			end
						
			local data = {}
			
			for _, shipPart in ipairs(ship:GetChildren()) do
				if string.match(shipPart.Name, "Spinal") then
					table.insert(data, spinal(shipPart))
				end
			end
			
			return data
		end

		local function turrets()
			local data = {}

			for _, plate in ipairs(ship:GetChildren()) do
				if plate.Name == 'TurretPlate' and plate:FindFirstChild('TurretName') then
					table.insert(data, getValue(plate, 'TurretName'))
				end
			end

			return data
		end

		local function fighters()
			local data = {}
			for _, plate in ipairs(ship:GetDescendants()) do
				if plate:FindFirstChild('ObjectClass') and getValue(plate, 'ObjectClass') == 'FighterSpawn' then
					local fighter = getValue(plate, 'FighterName')
					if fighter then
						table.insert(data, fighter)
					end
				end
			end
			return data
		end

		local function config(key)
			return getValue(ship.Configuration, key)
		end

		local data = {}

		data.name = ship.Name
		data.test = not not test
		if data.test then
			if  not data.name:find('[Tt][Ee][Ss][Tt]') and not data.name:find('[Dd][Ee][Vv][Ss]') then
				data.name = data.name .. ' (DEVS)'
			end
		end
		data.class = config('Class')
		data.description = config('Description')
		data.eventId = config('EventId') or 0
		data.permitOverride = config('EventPermitOverride')
		data.explosionSize = config('ExplosionSize') or 0
		data.notForSale = config('NotForSale') or false
		data.cargoHold = config('CargoHoldCapacity') or 0
		data.oreHold = config('OreHoldCapacity') or 0
		data.secret = config('Secret') or false
		data.nonPlayer = config('NonPlayer') or false
		data.canWarp = config('NoWarp') ~= true
		data.stealth = config('Stealth') or false
		data.customDrift = getValue(ship.PilotSeat, 'CustomDrift')
		data.vip = config('VIP') or false

		data.health = {}
		data.health.shield = config('MaxShield')
		data.health.hull = config('MaxHull')

		data.topSpeed = getProperty(ship.PilotSeat, 'MaxSpeed')
		data.acceleration = getProperty(ship.PilotSeat, 'Torque')
		data.turnSpeed = getProperty(ship.PilotSeat, 'TurnSpeed')

		data.weapons = {}
		data.weapons.spinals = spinals()
		data.weapons.turrets = turrets()

		data.fighters = fighters()

		data.extraMaterials = {}
		if ship.Configuration:FindFirstChild('ExtraMaterials') then
			for _, material in ipairs(ship.Configuration.ExtraMaterials:GetChildren()) do
				data.extraMaterials[material.Name] = getProperty(material, 'Value')
			end
		end

		return data
	end

	function galaxyInfo.uploadSerializedShips(serializedShips, test)
		local url = API .. '/ships'
		if test then url = url .. '?test=true' end
		local response = httpRequest({
			Url = url,
			Method = 'POST',
			Headers = {
				['X-Token'] = token,
				['Content-Type'] = 'application/json'
			},
			Body = jsonEncode(serializedShips)
		})
		if response.Body ~= 'Updated ships.' then error(response.Body) end
	end

	function galaxyInfo.getStatsForSerializedShip(serializedShip, range, loyalty)
		local response = jsonDecode(httpRequest({
			Url = API .. '/ships/stats-from-serialized-ship',
			Method = 'POST',
			Headers = {
				['X-Token'] = token,
				['Content-Type'] = 'application/json'
			},
			Body = jsonEncode({
				ship = serializedShip,
				range = range,
				loyalty = loyalty
			})
		}).Body)
		return response.stats
	end

	return galaxyInfo
end

return GalaxyInfo