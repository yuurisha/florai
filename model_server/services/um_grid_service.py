from utils.geo_utils import is_inside_um

def generate_um_grid(step=0.002):
    points = []
    for lat in frange(3.11, 3.136, step):
        for lon in frange(101.643, 101.664, step):
            if is_inside_um(lat, lon):
                print(f"[UM GRID] inside: {lat}, {lon}")
                points.append((lat, lon))
    return points

def frange(start, stop, step):
    while start <= stop:
        yield start
        start += step
