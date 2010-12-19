from xml.etree import ElementTree as ET

dom1 = ET.parse("bg.oel")
root = dom1.getroot()

map = []
for n in range(15):
	map.append([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
	
for n in root[2]:
	map[int(n.attrib["y"]) / 16][int(n.attrib["x"]) / 16] = n.attrib["id"]
	
for y in range(15):
	for x in range(16):
		print map[y][x],
	print ""