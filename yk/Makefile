NAMES	:= describe histogram scatter pair_plot

all: logreg_train
	node logreg_train.js datasets/dataset_train.csv

pp: pair_plot
	node pair_plot.js datasets/dataset_train.csv

describe:
	tsc $@.ts

histogram:
	tsc $@.ts

scatter:
	tsc $@.ts

pair_plot:
	tsc $@.ts

logreg_train:
	tsc $@.ts

svg:
	tsc $@.ts
