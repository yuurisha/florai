from shapely.geometry import Point, Polygon
from constants.um_boundary import UM_POLYGON

polygon = Polygon([(lon, lat) for (lat, lon) in UM_POLYGON])

def is_inside_um(lat: float, lon: float) -> bool:
    return polygon.covers(Point(lon, lat))

if __name__ == "__main__":
    print("Polygon bounds:", polygon.bounds)

    # A point that should be inside UM (roughly)
    test_lat, test_lon = 3.120, 101.655
    print("Test point inside UM?", is_inside_um(test_lat, test_lon))
