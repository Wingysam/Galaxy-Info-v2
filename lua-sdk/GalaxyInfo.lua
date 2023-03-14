local GalaxyInfo = { version = '0.1.0' }

local API = 'https://galaxy.wingysam.xyz/api/v2'

local function getProperty(instance, property)
  if remodel then
    return remodel.getRawProperty(instance, property)
  else
    return instance[property]
  end
end

local function getValue(parent, valueName, default)
  local value = parent:FindFirstChild(valueName)
  if not value then return default end
  return getProperty(value, 'Value')
end

local function randomString(length)
  local str = ''
	for _ = 1, length do
		str = str .. string.char(math.random(97, 122))
	end
	return str
end

local function httpRequest(request)
  if remodel then
    local function escape(str)
      return "'" .. string.gsub(str, "'", "''") .. "'"
    end
    local command = 'curl -s ' .. escape(request.Url)
    if request.Method then command = command .. " -X " .. escape(request.Method) end
    if request.Headers then
      for k, v in pairs(request.Headers) do
        command = command .. ' -H ' .. escape(k .. ': ' .. v)
      end
    end
    local tmpfile
    if request.Body then
      tmpfile = '/tmp/' .. randomString(32)
      remodel.writeFile(tmpfile, request.Body)
      command = command .. ' -d ' .. escape('@' .. tmpfile)
    end
    local handle = io.popen(command)
    local body = handle:read('*a')
    if tmpfile then remodel.removeFile(tmpfile) end
    return { Body = body }
  else
    return game:GetService('HttpService'):RequestAsync(request)
  end
end

local function jsonEncode(data)
  if remodel then
    return json.toString(data)
  else
    return game:GetService('HttpService'):JSONEncode(data)
  end
end

local function jsonDecode(str)
  if remodel then
    return json.fromString(str)
  else
    return game:GetService('HttpService'):JSONDecode(str)
  end
end

function GalaxyInfo.new(token)
  local galaxyInfo = {}

  function galaxyInfo.serializeShip(ship, test)
    local function spinals()
      local function gun(gunModel)
        local barrels = 0
        for _, barrel in ipairs(gunModel:GetChildren()) do
          if barrel.Name == 'Barrel' then
            barrels = barrels + 1
          end
        end
        return { barrels = barrels }
      end

      local function spinal(spinalModel)
        local data = {}
        data.weaponType = getValue(spinalModel, 'WeaponType')
        data.weaponSize = getValue(spinalModel, 'ProjectileSize')
        data.interval = getValue(spinalModel, 'BarrelInterval', 0)
        data.guns = {}

        data.reloadOverride = getValue(spinalModel, 'ReloadTime')

        if getValue(spinalModel, 'ObjectClass') == 'MultiGun' then
          for _, gunModel in ipairs(spinalModel:GetChildren()) do
            if gunModel.ClassName == 'Model' then
              table.insert(data.guns, gun(gunModel))
            end
          end
        else
          table.insert(data.guns, gun(spinalModel))
        end

        return data
      end

      local data = {}
      local weapon1 = getValue(ship.PilotSeat, 'PilotWeapon1')
      local weapon2 = getValue(ship.PilotSeat, 'PilotWeapon2')
      if weapon1 then data.f = spinal(ship[weapon1]) end
      if weapon2 then data.g = spinal(ship[weapon2]) end
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